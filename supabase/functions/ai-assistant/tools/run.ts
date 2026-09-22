import { validateSchema } from "./schema.ts";
import { ToolError, type Tool, type ToolContext, type ToolResult } from "./types.ts";

export const TOOL_TIMEOUT_MS = 8_000;
export const MAX_RESULT_BYTES = 6 * 1024;

export type ToolBase = Omit<ToolContext, "args">;

/**
 * Confirm-first backstop for write tools (P1.4, docs/CONCIERGE_TOOLS.md §4). Only `agent.ts`
 * passes this — direct tool mode (`handleDirectTool` in index.ts) does not, so a single
 * deterministic `confirmed:true` call there always succeeds, as designed.
 *
 * The PRIMARY control is the system prompt telling the model to show a draft and wait for an
 * explicit yes; this is the backstop against a model confirming its own draft in the same
 * automated loop, with no human turn in between: a write tool executed with `confirmed:true`
 * only if (a) the request's own last user-role message is non-empty, and (b) this tool name was
 * not already invoked earlier in the SAME request (regardless of that earlier call's own
 * `confirmed` value — a fresh preview-then-self-confirm inside one loop is exactly what this
 * blocks; a confirmed:true call that is the tool's first invocation of the request is always the
 * genuine case: a NEW request whose latest message is the user's own "yes").
 */
export interface WriteConfirmGuard {
  /** Write-tool names already invoked earlier in this same agent run; mutated by `runTool`. */
  calledTools: Set<string>;
  lastUserMessageNonEmpty: boolean;
}

/** True when `role` may use `tool` (owner-only tools are hidden from every other role). */
export const canUseTool = (tool: Tool, role: ToolBase["role"]): boolean =>
  tool.access === "member" || role === "owner";

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ToolError("internal", "Strumento troppo lento")), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });

const fail = (code: ToolError["code"], message: string): ToolResult => ({ ok: false, error: { code, message } });

/** Cap the serialised size; oversized data is replaced by a truncated preview, never sent whole. */
const capResult = (data: unknown): ToolResult => {
  const json = JSON.stringify(data ?? null);
  if (json.length <= MAX_RESULT_BYTES) return { ok: true, data: data ?? null };
  return {
    ok: true,
    data: { truncated: true, note: "Risultato troppo grande, anteprima parziale", preview: json.slice(0, MAX_RESULT_BYTES - 200) },
  };
};

/**
 * Execute one tool call: unknown-tool / role check → JSON-parse args → schema validation → handler
 * (with timeout) → size cap. Never throws; every failure becomes `{ ok:false, error }` so it can be
 * fed back to the model. `rawArgs` is the model's `arguments` string (or an already-parsed object
 * for direct tool mode).
 */
export const runTool = async (
  tools: readonly Tool[],
  name: string,
  rawArgs: unknown,
  base: ToolBase,
  timeoutMs = TOOL_TIMEOUT_MS,
  writeGuard?: WriteConfirmGuard,
): Promise<ToolResult> => {
  const tool = tools.find((t) => t.name === name);
  if (!tool) return fail("unknown_tool", `Strumento sconosciuto: ${name}`);
  if (!canUseTool(tool, base.role)) return fail("forbidden", "Il tuo ruolo non può usare questo strumento");

  let args: unknown = rawArgs;
  if (typeof rawArgs === "string") {
    if (rawArgs.trim() === "") {
      args = {};
    } else {
      try {
        args = JSON.parse(rawArgs);
      } catch {
        return fail("invalid_args", "Gli argomenti non sono JSON valido");
      }
    }
  } else if (rawArgs === undefined || rawArgs === null) {
    args = {};
  }

  const problem = validateSchema(tool.parameters, args);
  if (problem) return fail("invalid_args", problem);

  if (tool.write && writeGuard) {
    const confirmed = (args as Record<string, unknown>).confirmed === true;
    if (confirmed) {
      if (!writeGuard.lastUserMessageNonEmpty) {
        return fail("invalid_args", "Serve un messaggio esplicito dell'utente per confermare un'azione che scrive dati.");
      }
      if (writeGuard.calledTools.has(name)) {
        return fail(
          "conflict",
          "Questo strumento è già stato usato in questa richiesta: la conferma deve arrivare in un nuovo messaggio dell'utente.",
        );
      }
    }
    writeGuard.calledTools.add(name);
  }

  try {
    const data = await withTimeout(tool.handler({ ...base, args: args as Record<string, unknown> }), timeoutMs);
    return capResult(data);
  } catch (error) {
    if (error instanceof ToolError) return fail(error.code, error.message);
    console.error(`tool ${name} failed`); // no error text: it may contain row data
    return fail("internal", "Errore interno dello strumento");
  }
};

/** OpenAI-style `tools` array for the chat-completions request. */
export const toOpenAiTools = (tools: readonly Tool[]) =>
  tools.map((tool) => ({
    type: "function" as const,
    function: { name: tool.name, description: tool.description, parameters: tool.parameters },
  }));

export type OpenAiTool = ReturnType<typeof toOpenAiTools>[number];
