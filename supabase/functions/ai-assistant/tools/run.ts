import { validateSchema } from "./schema.ts";
import { ToolError, type Tool, type ToolContext, type ToolResult } from "./types.ts";

export const TOOL_TIMEOUT_MS = 8_000;
export const MAX_RESULT_BYTES = 6 * 1024;

export type ToolBase = Omit<ToolContext, "args">;

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
