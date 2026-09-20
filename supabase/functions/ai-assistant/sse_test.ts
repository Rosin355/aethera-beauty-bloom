import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { DONE_FRAME, encodeEvent, errorFrame } from "./sse.ts";

const parse = (frame: string) => JSON.parse(frame.replace(/^data: /, "").trim());

Deno.test("text frames keep the OpenAI chunk shape the web client reads", () => {
  const frame = encodeEvent({ type: "text", delta: "Ciao\n\nmondo" });
  assertEquals(frame.startsWith("data: "), true);
  assertEquals(frame.endsWith("\n\n"), true);
  assertEquals(parse(frame).choices[0].delta.content, "Ciao\n\nmondo");
});

Deno.test("tool frames have no `choices` (legacy clients ignore them)", () => {
  const call = parse(encodeEvent({ type: "tool_call", id: "c1", name: "get_center_kpi" }));
  assertEquals(call, { type: "tool_call", id: "c1", name: "get_center_kpi" });
  assertEquals("choices" in call, false);

  const ok = parse(encodeEvent({ type: "tool_result", id: "c1", name: "n", ok: true, result: { a: 1 } }));
  assertEquals(ok, { type: "tool_result", id: "c1", name: "n", ok: true, result: { a: 1 } });
  const err = parse(encodeEvent({ type: "tool_result", id: "c1", name: "n", ok: false, error: { code: "forbidden", message: "no" } }));
  assertEquals(err.error, { code: "forbidden", message: "no" });
  assertEquals("choices" in err, false);
});

Deno.test("error and done frames", () => {
  assertEquals(parse(errorFrame("boom")), { type: "error", message: "boom" });
  assertEquals(DONE_FRAME, "data: [DONE]\n\n");
});
