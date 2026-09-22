import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { fakeSupabase, toolBase } from "../test_helpers.ts";
import { canUseTool, MAX_RESULT_BYTES, runTool, toOpenAiTools, type WriteConfirmGuard } from "./run.ts";
import { defineTool, ToolError } from "./types.ts";

const { client } = fakeSupabase({});

const echo = defineTool<{ text: string }>({
  name: "echo",
  description: "echo",
  parameters: {
    type: "object",
    properties: { text: { type: "string", maxLength: 20 } },
    required: ["text"],
    additionalProperties: false,
  },
  access: "member",
  write: false,
  handler: ({ args, centerId, role }) => Promise.resolve({ text: args.text, centerId, role }),
});

const ownerOnly = defineTool<Record<string, never>>({
  name: "secret",
  description: "owner",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  access: "owner",
  write: false,
  handler: () => Promise.resolve({ revenue: 1 }),
});

const boom = defineTool<Record<string, never>>({
  name: "boom",
  description: "fails",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  access: "member",
  write: false,
  handler: () => Promise.reject(new Error("SELECT secret FROM users -- leaked")),
});

const notFound = defineTool<Record<string, never>>({
  name: "nf",
  description: "throws ToolError",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  access: "member",
  write: false,
  handler: () => Promise.reject(new ToolError("not_found", "manca")),
});

const big = defineTool<Record<string, never>>({
  name: "big",
  description: "huge result",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  access: "member",
  write: false,
  handler: () => Promise.resolve({ blob: "x".repeat(MAX_RESULT_BYTES * 2) }),
});

const slow = defineTool<Record<string, never>>({
  name: "slow",
  description: "never returns",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  access: "member",
  write: false,
  handler: () => new Promise(() => {}),
});

const write = defineTool<{ confirmed: boolean }>({
  name: "write_thing",
  description: "writes",
  parameters: {
    type: "object",
    properties: { confirmed: { type: "boolean" } },
    required: ["confirmed"],
    additionalProperties: false,
  },
  access: "member",
  write: true,
  handler: ({ args }) => Promise.resolve({ wrote: args.confirmed }),
});

const tools = [echo, ownerOnly, boom, notFound, big, slow, write];

Deno.test("runs a valid call from a JSON string and injects the server-side tenant", async () => {
  const r = await runTool(tools, "echo", '{"text":"ciao"}', toolBase(client, { role: "operator" }));
  assertEquals(r, { ok: true, data: { text: "ciao", centerId: "aaaaaaaa-0000-4000-8000-000000000001", role: "operator" } });
});

Deno.test("empty / missing args are treated as {}", async () => {
  assertEquals((await runTool(tools, "secret", "", toolBase(client))).ok, true);
  assertEquals((await runTool(tools, "secret", undefined, toolBase(client))).ok, true);
});

Deno.test("unknown tool", async () => {
  const r = await runTool(tools, "nope", "{}", toolBase(client));
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error.code, "unknown_tool");
});

Deno.test("owner-only tool is forbidden for other roles, allowed for owner", async () => {
  for (const role of ["operator", "receptionist"] as const) {
    const r = await runTool(tools, "secret", {}, toolBase(client, { role }));
    assertEquals(r.ok, false);
    if (!r.ok) assertEquals(r.error.code, "forbidden");
  }
  assertEquals((await runTool(tools, "secret", {}, toolBase(client, { role: "owner" }))).ok, true);
  assertEquals(canUseTool(ownerOnly, "operator"), false);
  assertEquals(canUseTool(echo, "receptionist"), true);
});

Deno.test("invalid JSON, bad types and a smuggled center_id are all invalid_args", async () => {
  for (const raw of ["{not json", '{"text": 5}', '{"text":"ok","center_id":"aaaaaaaa-0000-4000-8000-000000000002"}', '{"text":"' + "x".repeat(21) + '"}', "[]", '"str"']) {
    const r = await runTool(tools, "echo", raw, toolBase(client));
    assertEquals(r.ok, false, raw);
    if (!r.ok) assertEquals(r.error.code, "invalid_args", raw);
  }
});

Deno.test("ToolError keeps its code; unexpected errors are generic (no leak)", async () => {
  const nf = await runTool(tools, "nf", {}, toolBase(client));
  assertEquals(nf, { ok: false, error: { code: "not_found", message: "manca" } });

  const originalError = console.error;
  console.error = () => {};
  try {
    const b = await runTool(tools, "boom", {}, toolBase(client));
    assertEquals(b.ok, false);
    if (!b.ok) {
      assertEquals(b.error.code, "internal");
      assertEquals(b.error.message.includes("SELECT"), false);
    }
  } finally {
    console.error = originalError;
  }
});

Deno.test("oversized results are replaced by a truncated preview", async () => {
  const r = await runTool(tools, "big", {}, toolBase(client));
  assertEquals(r.ok, true);
  if (r.ok) {
    const data = r.data as { truncated: boolean; preview: string };
    assertEquals(data.truncated, true);
    assertEquals(JSON.stringify(r.data).length < MAX_RESULT_BYTES + 400, true);
  }
});

Deno.test("a hanging handler times out", async () => {
  const r = await runTool(tools, "slow", {}, toolBase(client), 30);
  assertEquals(r.ok, false);
  if (!r.ok) assertStringIncludes(r.error.message, "lento");
});

Deno.test("toOpenAiTools exposes name/description/parameters only", () => {
  const defs = toOpenAiTools([echo]);
  assertEquals(defs, [{ type: "function", function: { name: "echo", description: "echo", parameters: echo.parameters } }]);
});

Deno.test("without a writeGuard, confirmed:true always succeeds (direct tool mode)", async () => {
  const r1 = await runTool(tools, "write_thing", { confirmed: true }, toolBase(client));
  const r2 = await runTool(tools, "write_thing", { confirmed: true }, toolBase(client));
  assertEquals(r1.ok, true);
  assertEquals(r2.ok, true); // no guard = no "already called" memory
});

Deno.test("writeGuard: confirmed:true requires a non-empty last user message", async () => {
  const guard: WriteConfirmGuard = { calledTools: new Set(), lastUserMessageNonEmpty: false };
  const r = await runTool(tools, "write_thing", { confirmed: true }, toolBase(client), undefined, guard);
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error.code, "invalid_args");
});

Deno.test("writeGuard: a second confirmed:true call to the same tool in one run is refused", async () => {
  const guard: WriteConfirmGuard = { calledTools: new Set(), lastUserMessageNonEmpty: true };
  const preview = await runTool(tools, "write_thing", { confirmed: false }, toolBase(client), undefined, guard);
  assertEquals(preview.ok, true);
  assertEquals(guard.calledTools.has("write_thing"), true);

  const confirm = await runTool(tools, "write_thing", { confirmed: true }, toolBase(client), undefined, guard);
  assertEquals(confirm.ok, false);
  if (!confirm.ok) assertEquals(confirm.error.code, "conflict");
});

Deno.test("writeGuard: confirmed:true as the tool's FIRST call this run is allowed", async () => {
  const guard: WriteConfirmGuard = { calledTools: new Set(), lastUserMessageNonEmpty: true };
  const r = await runTool(tools, "write_thing", { confirmed: true }, toolBase(client), undefined, guard);
  assertEquals(r.ok, true);
  assertEquals(guard.calledTools.has("write_thing"), true);
});

Deno.test("writeGuard: a non-write tool is never recorded or gated", async () => {
  const guard: WriteConfirmGuard = { calledTools: new Set(), lastUserMessageNonEmpty: false };
  const r = await runTool(tools, "echo", { text: "hi" }, toolBase(client), undefined, guard);
  assertEquals(r.ok, true);
  assertEquals(guard.calledTools.size, 0);
});
