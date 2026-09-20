import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  type AgentEvent,
  EMPTY_ANSWER_FALLBACK,
  FINAL_ROUND_NUDGE,
  MAX_MODEL_CALLS,
  MAX_TOOL_CALLS_PER_ROUND,
  MAX_TOOL_CALLS_TOTAL,
  runAgent,
} from "./agent.ts";
import type { LlmEvent, LlmRequest, LlmToolCall, StreamRound } from "./llm.ts";
import { fakeSupabase, toolBase } from "./test_helpers.ts";
import { defineTool, type Tool } from "./tools/types.ts";

const { client } = fakeSupabase({});

const kpi = defineTool<Record<string, never>>({
  name: "get_center_kpi",
  description: "kpi",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  access: "owner",
  write: false,
  handler: () => Promise.resolve({ avg_ticket_7d: 62.5 }),
});
const agenda = defineTool<{ day?: string }>({
  name: "list_appointments",
  description: "agenda",
  parameters: { type: "object", properties: { day: { type: "string", format: "date" } }, additionalProperties: false },
  access: "member",
  write: false,
  handler: () => Promise.resolve({ appointments: [] }),
});
const tools: Tool[] = [kpi, agenda];

type Round = { text?: string[]; toolCalls?: LlmToolCall[] };

/** Scripted model: round N of the conversation returns script[N]; records every request it receives. */
const scripted = (script: Round[]) => {
  const requests: LlmRequest[] = [];
  const streamRound: StreamRound = async function* (request) {
    // snapshot: the agent mutates `messages` between rounds
    requests.push({ ...request, messages: structuredClone(request.messages) });
    const round = script[Math.min(requests.length - 1, script.length - 1)];
    for (const delta of round.text ?? []) yield { type: "text", delta } as LlmEvent;
    yield { type: "done", toolCalls: round.toolCalls ?? [], finishReason: round.toolCalls?.length ? "tool_calls" : "stop" };
  };
  return { streamRound, requests };
};

const collect = async (gen: AsyncGenerator<AgentEvent, unknown>) => {
  const events: AgentEvent[] = [];
  let step = await gen.next();
  while (!step.done) {
    events.push(step.value);
    step = await gen.next();
  }
  return { events, summary: step.value };
};

const call = (id: string, name: string, args = "{}"): LlmToolCall => ({ id, name, arguments: args });
const textOf = (events: AgentEvent[]) => events.flatMap((e) => e.type === "text" ? [e.delta] : []).join("");

Deno.test("tool round then final answer: results are fed back, text streams, events are ordered", async () => {
  const { streamRound, requests } = scripted([
    { toolCalls: [call("c1", "get_center_kpi")] },
    { text: ["Lo scontrino medio ", "è 62,5 €."] },
  ]);
  const { events, summary } = await collect(runAgent({
    systemPrompt: "SYS", history: [{ role: "user", content: "com'è andata?" }], tools, toolBase: toolBase(client), streamRound,
  }));

  assertEquals(events.map((e) => e.type), ["tool_call", "tool_result", "text", "text"]);
  const result = events[1];
  assertEquals(result.type === "tool_result" && result.ok && (result.result as { avg_ticket_7d: number }).avg_ticket_7d, 62.5);
  assertEquals(textOf(events), "Lo scontrino medio è 62,5 €.");
  assertEquals(summary, { modelCalls: 2, toolCalls: 1 });

  // second request carries the assistant tool_calls + the tool message
  const second = requests[1].messages;
  assertEquals(second.map((m) => m.role), ["system", "user", "assistant", "tool"]);
  const toolMsg = second[3];
  assertEquals(toolMsg.role === "tool" && toolMsg.tool_call_id, "c1");
  assertStringIncludes(toolMsg.role === "tool" ? toolMsg.content : "", '"ok":true');
});

Deno.test("owner sees owner tools, operator does not (offered tools are role-filtered)", async () => {
  const { streamRound, requests } = scripted([{ text: ["ok"] }]);
  await collect(runAgent({ systemPrompt: "S", history: [{ role: "user", content: "x" }], tools, toolBase: toolBase(client, { role: "operator" }), streamRound }));
  assertEquals(requests[0].tools?.map((t) => t.function.name), ["list_appointments"]);

  const owner = scripted([{ text: ["ok"] }]);
  await collect(runAgent({ systemPrompt: "S", history: [{ role: "user", content: "x" }], tools, toolBase: toolBase(client, { role: "owner" }), streamRound: owner.streamRound }));
  assertEquals(owner.requests[0].tools?.map((t) => t.function.name), ["get_center_kpi", "list_appointments"]);
});

Deno.test("a model that calls an owner tool as operator gets forbidden, and the loop continues", async () => {
  const { streamRound } = scripted([
    { toolCalls: [call("c1", "get_center_kpi")] },
    { text: ["Non posso mostrarti quei numeri."] },
  ]);
  const { events } = await collect(runAgent({
    systemPrompt: "S", history: [{ role: "user", content: "x" }], tools, toolBase: toolBase(client, { role: "operator" }), streamRound,
  }));
  const result = events.find((e) => e.type === "tool_result");
  assertEquals(result?.type === "tool_result" && result.error?.code, "forbidden");
  assertEquals(textOf(events), "Non posso mostrarti quei numeri.");
});

Deno.test("no center → no tools offered, single plain round", async () => {
  const { streamRound, requests } = scripted([{ text: ["Ciao"] }]);
  const { events, summary } = await collect(runAgent({
    systemPrompt: "S", history: [{ role: "user", content: "ciao" }], tools, toolBase: null, streamRound,
  }));
  assertEquals(requests.length, 1);
  assertEquals(requests[0].tools, undefined);
  assertEquals(textOf(events), "Ciao");
  assertEquals(summary, { modelCalls: 1, toolCalls: 0 });
});

Deno.test("max 5 model calls: a model that never stops calling tools is forced to answer on call 5", async () => {
  const { streamRound, requests } = scripted([
    ...Array.from({ length: 4 }, (_, i) => ({ toolCalls: [call(`c${i}`, "list_appointments")] })),
    { text: ["Ecco la risposta finale."], toolCalls: [call("cX", "list_appointments")] }, // tries again on the forced call
  ]);
  const { events, summary } = await collect(runAgent({
    systemPrompt: "SYS", history: [{ role: "user", content: "x" }], tools, toolBase: toolBase(client), streamRound,
  }));
  assertEquals(requests.length, MAX_MODEL_CALLS);
  assertEquals(summary, { modelCalls: 5, toolCalls: 4 });
  // calls 1-4 offer tools, call 5 does not and carries the nudge in the system prompt
  for (let i = 0; i < 4; i++) assertEquals(requests[i].tools !== undefined, true);
  assertEquals(requests[4].tools, undefined);
  const sys = requests[4].messages[0];
  assertEquals(sys.role === "system" && sys.content, "SYS" + FINAL_ROUND_NUDGE);
  // the tool call attempted on the forced round is NOT executed
  assertEquals(events.filter((e) => e.type === "tool_call").length, 4);
  assertEquals(textOf(events), "Ecco la risposta finale.");
});

Deno.test("per-round and total tool-call caps: refused calls are still answered with an error", async () => {
  const many = Array.from({ length: MAX_TOOL_CALLS_PER_ROUND + 2 }, (_, i) => call(`c${i}`, "list_appointments"));
  const { streamRound, requests } = scripted([{ toolCalls: many }, { text: ["fatto"] }]);
  const { events, summary } = await collect(runAgent({
    systemPrompt: "S", history: [{ role: "user", content: "x" }], tools, toolBase: toolBase(client), streamRound,
  }));
  const results = events.filter((e) => e.type === "tool_result");
  assertEquals(results.length, many.length);
  assertEquals(results.filter((e) => e.type === "tool_result" && e.ok).length, MAX_TOOL_CALLS_PER_ROUND);
  assertEquals(results.at(-1)?.type === "tool_result" && results.at(-1)?.type === "tool_result" && (results.at(-1) as { error?: { code: string } }).error?.code, "too_many_calls");
  assertEquals(summary, { modelCalls: 2, toolCalls: MAX_TOOL_CALLS_PER_ROUND });
  // every tool_call id has a tool message (otherwise the API would reject the next request)
  const toolMsgs = requests[1].messages.filter((m) => m.role === "tool");
  assertEquals(toolMsgs.length, many.length);
  assertEquals(MAX_TOOL_CALLS_TOTAL >= MAX_TOOL_CALLS_PER_ROUND, true);
});

Deno.test("malformed arguments and unknown tools come back as errors the model can react to", async () => {
  const { streamRound } = scripted([
    { toolCalls: [call("a", "list_appointments", "{oops"), call("b", "does_not_exist"), call("c", "list_appointments", '{"day":"2026-09-16","center_id":"x"}')] },
    { text: ["Riprovo."] },
  ]);
  const { events } = await collect(runAgent({
    systemPrompt: "S", history: [{ role: "user", content: "x" }], tools, toolBase: toolBase(client), streamRound,
  }));
  const codes = events.flatMap((e) => e.type === "tool_result" ? [e.error?.code] : []);
  assertEquals(codes, ["invalid_args", "unknown_tool", "invalid_args"]);
});

Deno.test("text before a tool call and text after are separated by a blank line", async () => {
  const { streamRound } = scripted([
    { text: ["Controllo subito."], toolCalls: [call("c1", "list_appointments")] },
    { text: ["Oggi hai 0 appuntamenti."] },
  ]);
  const { events } = await collect(runAgent({
    systemPrompt: "S", history: [{ role: "user", content: "x" }], tools, toolBase: toolBase(client), streamRound,
  }));
  assertEquals(textOf(events), "Controllo subito.\n\nOggi hai 0 appuntamenti.");
});

Deno.test("an empty final answer is replaced by an honest fallback", async () => {
  const { streamRound } = scripted([{ text: [] }]);
  const { events } = await collect(runAgent({
    systemPrompt: "S", history: [{ role: "user", content: "x" }], tools, toolBase: toolBase(client), streamRound,
  }));
  assertEquals(textOf(events), EMPTY_ANSWER_FALLBACK);
});

Deno.test("past the deadline the very next call is the forced final one", async () => {
  const { streamRound, requests } = scripted([{ toolCalls: [call("c1", "list_appointments")] }, { text: ["fine"] }]);
  let now = 1_000;
  const realNow = Date.now;
  Date.now = () => now;
  try {
    const gen = runAgent({
      systemPrompt: "S", history: [{ role: "user", content: "x" }], tools, toolBase: toolBase(client), streamRound, deadline: 1_500,
    });
    const first = await gen.next(); // tool_call of round 1
    assertEquals(first.value && (first.value as AgentEvent).type, "tool_call");
    now = 2_000; // budget exhausted while the tool ran
    await collect(gen);
  } finally {
    Date.now = realNow;
  }
  assertEquals(requests.length, 2);
  assertEquals(requests[1].tools, undefined);
});

Deno.test("the caller's history is never mutated and system messages cannot come from it", async () => {
  const history = [{ role: "user" as const, content: "ciao" }];
  const { streamRound, requests } = scripted([{ text: ["ok"] }]);
  await collect(runAgent({ systemPrompt: "SYS", history, tools, toolBase: toolBase(client), streamRound }));
  assertEquals(history.length, 1);
  assertEquals(requests[0].messages.filter((m) => m.role === "system").length, 1);
});
