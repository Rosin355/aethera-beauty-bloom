import type { ChatMessage, LlmEvent, StreamRound } from "./llm.ts";
import { canUseTool, runTool, toOpenAiTools, type ToolBase } from "./tools/run.ts";
import type { Tool, ToolResult } from "./tools/types.ts";

export const MAX_MODEL_CALLS = 5;
export const MAX_TOOL_CALLS_PER_ROUND = 4;
export const MAX_TOOL_CALLS_TOTAL = 8;
export const FINAL_ROUND_NUDGE =
  "\n\nHai raccolto abbastanza dati: rispondi ora all'utente in italiano, senza chiamare altri strumenti.";
export const EMPTY_ANSWER_FALLBACK = "Non riesco a completare la risposta in questo momento. Riprova tra poco.";

export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; id: string; name: string }
  | {
    type: "tool_result";
    id: string;
    name: string;
    ok: boolean;
    result?: unknown;
    error?: { code: string; message: string };
  };

export interface AgentSummary {
  modelCalls: number;
  toolCalls: number;
}

export interface AgentInput {
  systemPrompt: string;
  /** user/assistant text only (the request's sanitized history). */
  history: ChatMessage[];
  /** Every known tool; the ones offered to the model are filtered by `toolBase.role`. */
  tools: readonly Tool[];
  /** Server-resolved tenant context; `null` = no center → no tools, plain chat. */
  toolBase: ToolBase | null;
  streamRound: StreamRound;
  maxModelCalls?: number;
  /** Epoch ms after which the next model call is forced to be the final, tool-less answer. */
  deadline?: number;
  signal?: AbortSignal;
}

const toResultEvent = (id: string, name: string, result: ToolResult): AgentEvent =>
  result.ok
    ? { type: "tool_result", id, name, ok: true, result: result.data }
    : { type: "tool_result", id, name, ok: false, error: result.error };

/**
 * The tool loop. Up to `maxModelCalls` (5) model calls per user turn:
 *   model → tool calls → we execute → tool results fed back → repeat.
 * The LAST call omits `tools` and nudges the model to answer, so the user always gets text.
 * Text is forwarded live; rounds that both speak and call tools are separated by a blank line.
 */
export async function* runAgent(input: AgentInput): AsyncGenerator<AgentEvent, AgentSummary> {
  const maxModelCalls = input.maxModelCalls ?? MAX_MODEL_CALLS;
  const deadline = input.deadline ?? Number.POSITIVE_INFINITY;
  const { toolBase } = input;

  const offered = toolBase ? input.tools.filter((tool) => canUseTool(tool, toolBase.role)) : [];
  const openAiTools = toOpenAiTools(offered);

  const messages: ChatMessage[] = [{ role: "system", content: input.systemPrompt }, ...input.history];
  let modelCalls = 0;
  let toolCallsTotal = 0;
  let anyText = false;

  for (let call = 1; call <= maxModelCalls; call++) {
    const forceFinal = offered.length === 0 || call === maxModelCalls ||
      Date.now() > deadline || toolCallsTotal >= MAX_TOOL_CALLS_TOTAL;
    if (forceFinal && call > 1) {
      messages[0] = { role: "system", content: input.systemPrompt + FINAL_ROUND_NUDGE };
    }

    modelCalls++;
    let roundText = "";
    let done: Extract<LlmEvent, { type: "done" }> | null = null;
    let separated = false;

    for await (const event of input.streamRound({
      messages,
      tools: forceFinal ? undefined : openAiTools,
      signal: input.signal,
    })) {
      if (event.type === "text") {
        if (!separated) {
          separated = true;
          if (anyText) yield { type: "text", delta: "\n\n" };
        }
        roundText += event.delta;
        anyText = true;
        yield { type: "text", delta: event.delta };
      } else {
        done = event;
      }
    }

    const toolCalls = done?.toolCalls ?? [];
    if (forceFinal || toolCalls.length === 0 || !toolBase) break;

    messages.push({
      role: "assistant",
      content: roundText || null,
      tool_calls: toolCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.name, arguments: tc.arguments },
      })),
    });

    // Every tool_call id must be answered, even those we refuse to run.
    for (let i = 0; i < toolCalls.length; i++) {
      const tc = toolCalls[i];
      yield { type: "tool_call", id: tc.id, name: tc.name };

      let result: ToolResult;
      if (i >= MAX_TOOL_CALLS_PER_ROUND || toolCallsTotal >= MAX_TOOL_CALLS_TOTAL) {
        result = { ok: false, error: { code: "too_many_calls", message: "Troppe chiamate agli strumenti in questa richiesta" } };
      } else {
        toolCallsTotal++;
        result = await runTool(input.tools, tc.name, tc.arguments, toolBase);
      }

      yield toResultEvent(tc.id, tc.name, result);
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result.ok ? { ok: true, data: result.data } : { ok: false, error: result.error }),
      });
    }
  }

  if (!anyText) yield { type: "text", delta: EMPTY_ANSWER_FALLBACK };
  return { modelCalls, toolCalls: toolCallsTotal };
}
