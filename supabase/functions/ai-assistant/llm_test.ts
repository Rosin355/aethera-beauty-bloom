import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { eventsFromSse, readSseJson, type LlmEvent } from "./llm.ts";

const streamOf = (chunks: string[]): ReadableStream<Uint8Array> => {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
};

const frame = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;
const drain = async (gen: AsyncGenerator<LlmEvent>) => {
  const out: LlmEvent[] = [];
  for await (const e of gen) out.push(e);
  return out;
};

Deno.test("readSseJson: handles frames split across chunks, CRLF, comments, malformed frames and [DONE]", async () => {
  const body = streamOf([
    ": keep-alive\r\n\r\n",
    'data: {"a":1}\r\n\r\ndata: {"b"',
    ':2}\n\n',
    "data: not-json\n\n",
    'data: {"c":3}\n\ndata: [DONE]\n\ndata: {"after":"done"}\n\n',
  ]);
  const frames = [];
  for await (const f of readSseJson(body)) frames.push(f);
  assertEquals(frames, [{ a: 1 }, { b: 2 }, { c: 3 }]);
});

Deno.test("readSseJson: a final frame without trailing newline is still delivered", async () => {
  const frames = [];
  for await (const f of readSseJson(streamOf(['data: {"x":1}']))) frames.push(f);
  assertEquals(frames, [{ x: 1 }]);
});

Deno.test("eventsFromSse: plain text round", async () => {
  const events = await drain(eventsFromSse(streamOf([
    frame({ choices: [{ delta: { content: "Ciao " } }] }),
    frame({ choices: [{ delta: { content: "mondo" }, finish_reason: null }] }),
    frame({ choices: [{ delta: {}, finish_reason: "stop" }] }),
    "data: [DONE]\n\n",
  ])));
  assertEquals(events, [
    { type: "text", delta: "Ciao " },
    { type: "text", delta: "mondo" },
    { type: "done", toolCalls: [], finishReason: "stop" },
  ]);
});

Deno.test("eventsFromSse: tool-call fragments are assembled by index, in order", async () => {
  const events = await drain(eventsFromSse(streamOf([
    frame({ choices: [{ delta: { tool_calls: [{ index: 0, id: "call_a", function: { name: "simulate_goal", arguments: '{"goal_' } }] } }] }),
    frame({ choices: [{ delta: { tool_calls: [{ index: 1, id: "call_b", function: { name: "get_center_kpi", arguments: "{}" } }] } }] }),
    frame({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: 'amount":1000}' } }] } }] }),
    frame({ choices: [{ delta: {}, finish_reason: "tool_calls" }] }),
    "data: [DONE]\n\n",
  ])));
  assertEquals(events, [{
    type: "done",
    finishReason: "tool_calls",
    toolCalls: [
      { id: "call_a", name: "simulate_goal", arguments: '{"goal_amount":1000}' },
      { id: "call_b", name: "get_center_kpi", arguments: "{}" },
    ],
  }]);
});

Deno.test("eventsFromSse: gateways that omit ids/index still yield addressable calls; nameless fragments are dropped", async () => {
  const events = await drain(eventsFromSse(streamOf([
    frame({ choices: [{ delta: { tool_calls: [{ function: { name: "get_center_kpi", arguments: "{}" } }] }, finish_reason: "tool_calls" }] }),
    frame({ choices: [{ delta: { tool_calls: [{ index: 5, function: { arguments: "{}" } }] } }] }),
  ])));
  const done = events.at(-1);
  if (done?.type !== "done") throw new Error("expected done");
  assertEquals(done.toolCalls.length, 1);
  assertEquals(done.toolCalls[0].name, "get_center_kpi");
  assertEquals(done.toolCalls[0].id.startsWith("call_"), true);
});

Deno.test("eventsFromSse: text and tool call in the same round, message-style chunk accepted", async () => {
  const events = await drain(eventsFromSse(streamOf([
    frame({ choices: [{ message: { content: "Controllo.", tool_calls: [{ index: 0, id: "z", function: { name: "list_appointments", arguments: "{}" } }] }, finish_reason: "tool_calls" }] }),
  ])));
  assertEquals(events[0], { type: "text", delta: "Controllo." });
  assertEquals(events[1].type, "done");
});

Deno.test("eventsFromSse: frames without choices (usage, errors) are ignored", async () => {
  const events = await drain(eventsFromSse(streamOf([
    frame({ usage: { total_tokens: 3 } }),
    frame({ choices: [] }),
    frame({ choices: [{ delta: { content: "x" } }] }),
  ])));
  assertEquals(events.map((e) => e.type), ["text", "done"]);
});
