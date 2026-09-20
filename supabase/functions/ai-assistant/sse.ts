import type { AgentEvent } from "./agent.ts";

const frame = (payload: unknown): string => `data: ${JSON.stringify(payload)}\n\n`;

/**
 * Text keeps the OpenAI chunk shape the web client already parses; tool events are extra typed
 * frames that legacy clients ignore (they only read choices[0].delta.content).
 */
export const encodeEvent = (event: AgentEvent): string => {
  switch (event.type) {
    case "text":
      return frame({ choices: [{ index: 0, delta: { content: event.delta } }] });
    case "tool_call":
      return frame({ type: "tool_call", id: event.id, name: event.name });
    case "tool_result":
      return frame(
        event.ok
          ? { type: "tool_result", id: event.id, name: event.name, ok: true, result: event.result }
          : { type: "tool_result", id: event.id, name: event.name, ok: false, error: event.error },
      );
  }
};

export const errorFrame = (message: string): string => frame({ type: "error", message });
export const DONE_FRAME = "data: [DONE]\n\n";
