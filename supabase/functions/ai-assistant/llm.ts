import type { OpenAiTool } from "./tools/run.ts";

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | {
    role: "assistant";
    content: string | null;
    tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  }
  | { role: "tool"; tool_call_id: string; content: string };

export interface LlmToolCall {
  id: string;
  name: string;
  /** Raw JSON string exactly as produced by the model. */
  arguments: string;
}

export type LlmEvent =
  | { type: "text"; delta: string }
  | { type: "done"; toolCalls: LlmToolCall[]; finishReason: string | null };

export interface LlmRequest {
  messages: ChatMessage[];
  /** Omitted on the forced-final call: the model can then only answer in text. */
  tools?: OpenAiTool[];
  signal?: AbortSignal;
}

/** One model round: streams text deltas, then a final `done` with any tool calls. */
export type StreamRound = (request: LlmRequest) => AsyncGenerator<LlmEvent>;

export class UpstreamError extends Error {
  status: number;
  constructor(status: number) {
    super(`Errore nella comunicazione con l'AI: ${status}`);
    this.name = "UpstreamError";
    this.status = status;
  }
}

export interface GatewayConfig {
  apiKey: string;
  url: string;
  model: string;
}

/** Gateway settings from the environment. The URL/model defaults match what the function always used. */
export const gatewayConfigFromEnv = (): GatewayConfig => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY non configurata");
  return {
    apiKey,
    url: Deno.env.get("LLM_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1/chat/completions",
    model: Deno.env.get("AI_MODEL") ?? "google/gemini-2.5-flash",
  };
};

const DONE = Symbol("done");

const parseSseLine = (line: string): Record<string, unknown> | typeof DONE | null => {
  if (!line.startsWith("data:")) return null; // comments (":"), blank lines, other fields
  const payload = line.slice(5).trim();
  if (payload === "[DONE]") return DONE;
  if (payload === "") return null;
  try {
    const parsed = JSON.parse(payload);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null; // a malformed frame is skipped, never fatal
  }
};

/** Parse an SSE body into JSON frames; stops at `[DONE]`. */
export async function* readSseJson(body: ReadableStream<Uint8Array>): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        const frame = parseSseLine(line);
        if (frame === DONE) return;
        if (frame) yield frame;
      }
    }
    const tail = parseSseLine(buffer.trim());
    if (tail && tail !== DONE) yield tail;
  } finally {
    try {
      await reader.cancel();
    } catch { /* already closed */ }
  }
}

interface ToolCallDelta {
  index?: number;
  id?: string;
  function?: { name?: string; arguments?: string };
}

interface ChoiceDelta {
  content?: unknown;
  tool_calls?: ToolCallDelta[];
}

/**
 * Turn a chat-completions SSE body into LlmEvents. Tool calls arrive as fragments keyed by `index`
 * (id/name first, `arguments` in pieces); they are assembled here and emitted once, in `done`.
 * A missing id (some gateways omit it) is replaced by a generated one so every call stays addressable.
 */
export async function* eventsFromSse(body: ReadableStream<Uint8Array>): AsyncGenerator<LlmEvent> {
  const calls = new Map<number, { id: string; name: string; args: string }>();
  let finishReason: string | null = null;

  for await (const frame of readSseJson(body)) {
    const choice = (frame.choices as { delta?: ChoiceDelta; message?: ChoiceDelta; finish_reason?: string | null }[] | undefined)?.[0];
    if (!choice) continue;
    const delta = choice.delta ?? choice.message ?? {};

    if (typeof delta.content === "string" && delta.content.length > 0) {
      yield { type: "text", delta: delta.content };
    }

    for (const fragment of delta.tool_calls ?? []) {
      const index = typeof fragment.index === "number"
        ? fragment.index
        : fragment.id ? calls.size : Math.max(calls.size - 1, 0);
      const entry = calls.get(index) ?? { id: "", name: "", args: "" };
      if (fragment.id) entry.id = fragment.id;
      if (fragment.function?.name) entry.name += fragment.function.name;
      if (fragment.function?.arguments) entry.args += fragment.function.arguments;
      calls.set(index, entry);
    }

    if (choice.finish_reason) finishReason = choice.finish_reason;
  }

  const toolCalls = [...calls.entries()]
    .sort(([a], [b]) => a - b)
    .filter(([, call]) => call.name !== "")
    .map(([index, call]) => ({
      id: call.id || `call_${index}_${crypto.randomUUID().slice(0, 8)}`,
      name: call.name,
      arguments: call.args,
    }));

  yield { type: "done", toolCalls, finishReason };
}

/** StreamRound backed by the Lovable AI gateway (OpenAI-compatible). */
export const createGatewayStreamRound = (config: GatewayConfig): StreamRound =>
  async function* (request) {
    const response = await fetch(config.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        stream: true,
        ...(request.tools && request.tools.length > 0 ? { tools: request.tools } : {}),
      }),
      signal: request.signal,
    });

    if (!response.ok) {
      await response.text(); // drain; the body is not surfaced to callers
      console.error("AI gateway error:", response.status);
      throw new UpstreamError(response.status);
    }
    if (!response.body) throw new UpstreamError(502);

    yield* eventsFromSse(response.body);
  };
