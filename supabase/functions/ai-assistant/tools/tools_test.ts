import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { CENTER_ID, fakeSupabase, toolBase } from "../test_helpers.ts";
import { ALL_TOOLS, toolsForRole } from "./registry.ts";
import { runTool } from "./run.ts";

const findCall = (recorded: ReturnType<typeof fakeSupabase>["recorded"], name: string) =>
  recorded.find((r) => r.name === name);

Deno.test("registry: owner-only tools are hidden from operators and receptionists", () => {
  const names = (role: "owner" | "operator" | "receptionist") => toolsForRole(role).map((t) => t.name).sort();
  assertEquals(names("owner"), ["get_center_kpi", "get_center_profile", "get_protocol", "list_appointments", "simulate_goal"]);
  assertEquals(names("operator"), ["get_center_profile", "get_protocol", "list_appointments"]);
  assertEquals(names("receptionist"), ["get_center_profile", "get_protocol", "list_appointments"]);
});

Deno.test("registry: no tool schema lets the model choose the tenant", () => {
  for (const tool of ALL_TOOLS) {
    const props = Object.keys(tool.parameters.properties ?? {});
    for (const forbidden of ["center_id", "centerId", "user_id", "userId", "_center_id"]) {
      assertEquals(props.includes(forbidden), false, `${tool.name} exposes ${forbidden}`);
    }
    assertEquals(tool.parameters.additionalProperties, false, `${tool.name} must be strict`);
    if (tool.write) assertEquals(tool.parameters.required?.includes("confirmed"), true, `${tool.name} needs confirmed`);
  }
});

Deno.test("get_center_kpi: reads the view filtered by the server-side center, trims the dormant list", async () => {
  const dormant = Array.from({ length: 14 }, (_, i) => ({ client_key: `c${i}` }));
  const { client, recorded } = fakeSupabase({
    v_center_week_kpi: {
      data: { center_id: CENTER_ID, avg_ticket_7d: 62.5, dormant_clients_count: 14, dormant_clients: dormant },
      error: null,
    },
  });
  const r = await runTool(ALL_TOOLS, "get_center_kpi", {}, toolBase(client));
  assertEquals(r.ok, true);
  if (r.ok) {
    const d = r.data as Record<string, unknown>;
    assertEquals(d.avg_ticket_7d, 62.5);
    assertEquals((d.dormant_clients as unknown[]).length, 10);
    assertEquals(d.dormant_clients_truncated, true);
    assertEquals("center_id" in d, false);
  }
  const call = findCall(recorded, "v_center_week_kpi");
  assertEquals(call?.calls.some(([m, a]) => m === "eq" && a[0] === "center_id" && a[1] === CENTER_ID), true);
});

Deno.test("get_center_kpi: forbidden for operators without touching the database", async () => {
  const { client, recorded } = fakeSupabase({});
  const r = await runTool(ALL_TOOLS, "get_center_kpi", {}, toolBase(client, { role: "operator" }));
  assertEquals(r.ok, false);
  assertEquals(recorded.length, 0);
});

Deno.test("get_center_kpi: empty view row → not_found", async () => {
  const { client } = fakeSupabase({ v_center_week_kpi: { data: null, error: null } });
  const r = await runTool(ALL_TOOLS, "get_center_kpi", {}, toolBase(client));
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error.code, "not_found");
});

Deno.test("simulate_goal: passes the server-side center and validated amount to the RPC", async () => {
  const { client, recorded } = fakeSupabase({
    fn_simulate_goal: { data: [{ clients_needed: 12, hours_needed: 13.3 }], error: null },
  });
  const r = await runTool(ALL_TOOLS, "simulate_goal", { goal_amount: 1000 }, toolBase(client));
  assertEquals(r, { ok: true, data: { clients_needed: 12, hours_needed: 13.3 } });
  assertEquals(findCall(recorded, "fn_simulate_goal")?.calls[0][1], [{ _center_id: CENTER_ID, _goal_amount: 1000 }]);
});

Deno.test("simulate_goal: rejects bad amounts before any DB call", async () => {
  const { client, recorded } = fakeSupabase({});
  for (const bad of [0, -5, 1e12, "1000", null]) {
    const r = await runTool(ALL_TOOLS, "simulate_goal", { goal_amount: bad }, toolBase(client));
    assertEquals(r.ok, false);
    if (!r.ok) assertEquals(r.error.code, "invalid_args");
  }
  assertEquals((await runTool(ALL_TOOLS, "simulate_goal", {}, toolBase(client))).ok, false);
  assertEquals(recorded.length, 0);
});

Deno.test("simulate_goal: database 42501 / 22023 map to forbidden / invalid_args, other errors are generic", async () => {
  const errs: [string, string][] = [["42501", "forbidden"], ["22023", "invalid_args"], ["XX000", "internal"]];
  const originalError = console.error;
  console.error = () => {};
  try {
    for (const [code, expected] of errs) {
      const { client } = fakeSupabase({ fn_simulate_goal: { data: null, error: { code, message: "goal_amount non valido" } } });
      const r = await runTool(ALL_TOOLS, "simulate_goal", { goal_amount: 5 }, toolBase(client));
      assertEquals(r.ok, false);
      if (!r.ok) {
        assertEquals(r.error.code, expected);
        if (expected === "internal") assertEquals(r.error.message.includes("goal_amount"), false);
      }
    }
  } finally {
    console.error = originalError;
  }
});

Deno.test("list_appointments: today in the center time zone, local times, prices only when the RPC returns them", async () => {
  const { client, recorded } = fakeSupabase({
    centers: { data: { timezone: "Europe/Rome" }, error: null },
    fn_center_appointments: {
      data: [{
        id: "a1", client_name: "Carla Neri", service_name: "A", starts_at: "2026-09-16T08:00:00+00:00",
        ends_at: "2026-09-16T09:00:00+00:00", duration_minutes: 60, cabin: null, status: "confermato", price: null,
        notes: "x".repeat(300),
      }],
      error: null,
    },
    fn_center_gaps: {
      data: [{ cabin: 1, gap_start: "2026-09-16T10:00:00+00:00", gap_end: "2026-09-16T12:00:00+00:00", minutes: 120 }],
      error: null,
    },
  });
  // 2026-09-16T22:30Z is already 17 Sep 00:30 in Rome → default day must be the 17th
  const r = await runTool(ALL_TOOLS, "list_appointments", {}, toolBase(client, { role: "operator", now: new Date("2026-09-16T22:30:00Z") }));
  assertEquals(r.ok, true);
  if (r.ok) {
    const d = r.data as { day: string; appointments: Record<string, unknown>[]; free_slots: Record<string, unknown>[] };
    assertEquals(d.day, "2026-09-17");
    assertEquals(d.appointments[0].start, "10:00");
    assertEquals(d.appointments[0].end, "11:00");
    assertEquals("price" in d.appointments[0], false);
    assertEquals((d.appointments[0].notes as string).length <= 161, true);
    assertEquals(d.free_slots[0].start, "12:00");
  }
  assertEquals(findCall(recorded, "fn_center_appointments")?.calls[0][1], [{ _center_id: CENTER_ID, _day: "2026-09-17" }]);
  assertEquals(findCall(recorded, "fn_center_gaps")?.calls[0][1], [{ _center_id: CENTER_ID, _day: "2026-09-17" }]);
});

Deno.test("list_appointments: explicit day is used as is; malformed day is rejected", async () => {
  const { client, recorded } = fakeSupabase({
    centers: { data: { timezone: "Europe/Rome" }, error: null },
    fn_center_appointments: { data: [], error: null },
    fn_center_gaps: { data: [], error: null },
  });
  assertEquals((await runTool(ALL_TOOLS, "list_appointments", { day: "2026-10-01" }, toolBase(client))).ok, true);
  assertEquals(findCall(recorded, "fn_center_appointments")?.calls[0][1], [{ _center_id: CENTER_ID, _day: "2026-10-01" }]);
  for (const bad of ["domani", "2026-13-01", "2026-9-1"]) {
    assertEquals((await runTool(ALL_TOOLS, "list_appointments", { day: bad }, toolBase(client))).ok, false);
  }
});

Deno.test("get_center_profile: tolerates the slots table not existing yet (P1.5)", async () => {
  for (const code of ["42P01", "PGRST205"]) {
    const { client, recorded } = fakeSupabase({
      centers: { data: { name: "Aurora", timezone: "Europe/Rome", cabin_count: 2, opening_hours: {} }, error: null },
      business_services: { data: [{ name: "A", category: "Viso", price: 50, duration_minutes: 60 }], error: null },
      center_members: { data: [{ role: "owner" }, { role: "operator" }, { role: "operator" }], error: null },
      center_profile_slots: { data: null, error: { code, message: "missing" } },
    });
    const r = await runTool(ALL_TOOLS, "get_center_profile", {}, toolBase(client, { role: "receptionist" }));
    assertEquals(r.ok, true);
    if (r.ok) {
      const d = r.data as { slots_available: boolean; slots: unknown; team: Record<string, number>; services: { categories: string[] } };
      assertEquals(d.slots_available, false);
      assertEquals(d.slots, null);
      assertEquals(d.team, { owner: 1, operator: 2, receptionist: 0 });
      assertEquals(d.services.categories, ["Viso"]);
    }
    for (const name of ["centers", "business_services", "center_members", "center_profile_slots"]) {
      const call = findCall(recorded, name);
      const key = name === "centers" ? "id" : "center_id";
      assertEquals(call?.calls.some(([m, a]) => m === "eq" && a[0] === key && a[1] === CENTER_ID), true, `${name} must be filtered by the center`);
    }
  }
});

Deno.test("get_center_profile: returns the slots once the table exists; other slot errors are real errors", async () => {
  const base = {
    centers: { data: { name: "Aurora", timezone: "Europe/Rome", cabin_count: 1, opening_hours: {} }, error: null },
    business_services: { data: [], error: null },
    center_members: { data: [], error: null },
  };
  const ok = fakeSupabase({ ...base, center_profile_slots: { data: [{ slot_key: "q1", value: "x" }], error: null } });
  const r = await runTool(ALL_TOOLS, "get_center_profile", {}, toolBase(ok.client));
  assertEquals(r.ok && (r.data as { slots_available: boolean }).slots_available, true);

  const originalError = console.error;
  console.error = () => {};
  try {
    const bad = fakeSupabase({ ...base, center_profile_slots: { data: null, error: { code: "XX000", message: "boom" } } });
    const r2 = await runTool(ALL_TOOLS, "get_center_profile", {}, toolBase(bad.client));
    assertEquals(r2.ok, false);
  } finally {
    console.error = originalError;
  }
});

Deno.test("get_protocol: goes through ctx.knowledge only, trims content, reports empty results honestly", async () => {
  const { client, recorded } = fakeSupabase({});
  const seen: [string, number | undefined][] = [];
  const knowledge = {
    search: (q: string, n?: number) => {
      seen.push([q, n]);
      return Promise.resolve(q === "niente"
        ? []
        : [{ title: "Protocollo viso", description: "d", content: "y".repeat(3000) }]);
    },
  };
  const r = await runTool(ALL_TOOLS, "get_protocol", { name: "pulizia viso" }, toolBase(client, { knowledge, role: "receptionist" }));
  assertEquals(r.ok, true);
  if (r.ok) {
    const d = r.data as { results: { content: string; content_truncated: boolean }[] };
    assertEquals(d.results[0].content.length <= 1801, true);
    assertEquals(d.results[0].content_truncated, true);
  }
  assertEquals(seen[0], ["pulizia viso", 3]);
  assertEquals(recorded.length, 0); // no direct DB access from this tool

  const none = await runTool(ALL_TOOLS, "get_protocol", { name: "niente" }, toolBase(client, { knowledge }));
  assertEquals(none.ok && (none.data as { results: unknown[] }).results.length, 0);

  assertEquals((await runTool(ALL_TOOLS, "get_protocol", { name: "a" }, toolBase(client))).ok, false); // too short
  assertEquals((await runTool(ALL_TOOLS, "get_protocol", { name: "x".repeat(121) }, toolBase(client))).ok, false);
});
