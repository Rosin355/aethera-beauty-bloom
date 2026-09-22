import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { CENTER_ID, fakeSupabase, toolBase, USER_ID } from "../test_helpers.ts";
import { ALL_TOOLS, toolsForRole } from "./registry.ts";
import { runTool } from "./run.ts";

const findCall = (recorded: ReturnType<typeof fakeSupabase>["recorded"], name: string) =>
  recorded.find((r) => r.name === name);

Deno.test("registry: owner-only tools are hidden from operators and receptionists", () => {
  const names = (role: "owner" | "operator" | "receptionist") => toolsForRole(role).map((t) => t.name).sort();
  assertEquals(names("owner"), [
    "create_appointment",
    "generate_first_reading",
    "get_center_kpi",
    "get_center_profile",
    "get_latest_report",
    "get_missing_slots",
    "get_protocol",
    "list_appointments",
    "move_appointment",
    "propose_recall",
    "set_action_done",
    "set_profile_slot",
    "simulate_goal",
  ]);
  assertEquals(names("operator"), [
    "create_appointment",
    "get_center_profile",
    "get_missing_slots",
    "get_protocol",
    "list_appointments",
    "move_appointment",
    "set_profile_slot",
  ]);
  assertEquals(names("receptionist"), [
    "create_appointment",
    "get_center_profile",
    "get_missing_slots",
    "get_protocol",
    "list_appointments",
    "move_appointment",
    "set_profile_slot",
  ]);
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
      profile_slot_catalog: { data: null, error: { code, message: "missing" } },
    });
    const r = await runTool(ALL_TOOLS, "get_center_profile", {}, toolBase(client, { role: "receptionist" }));
    assertEquals(r.ok, true);
    if (r.ok) {
      const d = r.data as {
        slots_available: boolean;
        slots: unknown;
        team: Record<string, number>;
        services: { categories: string[] };
        completeness_pct: number | null;
      };
      assertEquals(d.slots_available, false);
      assertEquals(d.slots, null);
      assertEquals(d.completeness_pct, null); // no catalog yet -> nothing to compute against
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

Deno.test("get_center_profile: returns the slots and completeness once the tables exist; other slot errors are real errors", async () => {
  const base = {
    centers: { data: { name: "Aurora", timezone: "Europe/Rome", cabin_count: 1, opening_hours: {} }, error: null },
    business_services: { data: [], error: null },
    center_members: { data: [], error: null },
  };
  const catalog = [
    { slot_key: "q1", is_welcome_interview: true },
    { slot_key: "q2", is_welcome_interview: false },
  ];
  const ok = fakeSupabase({
    ...base,
    center_profile_slots: { data: [{ slot_key: "q1", value: "x" }], error: null },
    profile_slot_catalog: { data: catalog, error: null },
  });
  const r = await runTool(ALL_TOOLS, "get_center_profile", {}, toolBase(ok.client));
  assertEquals(r.ok, true);
  if (r.ok) {
    const d = r.data as { slots_available: boolean; completeness_pct: number };
    assertEquals(d.slots_available, true);
    // weight 3 (q1, answered) of a total 4 (3 + 1) -> 75%
    assertEquals(d.completeness_pct, 75);
  }

  const originalError = console.error;
  console.error = () => {};
  try {
    const bad = fakeSupabase({
      ...base,
      center_profile_slots: { data: null, error: { code: "XX000", message: "boom" } },
      profile_slot_catalog: { data: catalog, error: null },
    });
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

Deno.test("create_appointment: passes the server-side center and args through to the RPC", async () => {
  const { client, recorded } = fakeSupabase({
    fn_create_appointment: {
      data: { status: "draft", requires_confirmation: true, preview: { client_name: "Marta" } },
      error: null,
    },
  });
  const r = await runTool(
    ALL_TOOLS,
    "create_appointment",
    { client_name: "Marta", service_id: "s1", starts_at: "2026-09-18T15:00:00+02:00", confirmed: false },
    toolBase(client, { role: "operator" }),
  );
  assertEquals(r.ok, true);
  if (r.ok) assertEquals((r.data as { status: string }).status, "draft");
  assertEquals(findCall(recorded, "fn_create_appointment")?.calls[0][1], [{
    _center_id: CENTER_ID,
    _client_name: "Marta",
    _service_id: "s1",
    _starts_at: "2026-09-18T15:00:00+02:00",
    _cabin: null,
    _notes: null,
    _confirmed: false,
  }]);
});

Deno.test("create_appointment: a conflict is passed through as-is (alternatives, no draft_message)", async () => {
  const conflictResult = {
    status: "conflict",
    requested: { starts_at: "2026-09-18T15:00:00+02:00", ends_at: "2026-09-18T16:00:00+02:00", cabin: 1 },
    alternatives: [{ cabin: 2, starts_at: "2026-09-18T15:00:00+02:00", ends_at: "2026-09-18T16:00:00+02:00" }],
  };
  const { client } = fakeSupabase({ fn_create_appointment: { data: conflictResult, error: null } });
  const r = await runTool(
    ALL_TOOLS,
    "create_appointment",
    { client_name: "Marta", service_id: "s1", starts_at: "2026-09-18T15:00:00+02:00", cabin: 1, confirmed: true },
    toolBase(client),
  );
  assertEquals(r, { ok: true, data: conflictResult });
});

Deno.test("move_appointment: drafts a proposal message before writing, a confirmation message after", async () => {
  const draftResult = {
    status: "draft",
    requires_confirmation: true,
    preview: {
      id: "a1", client_name: "Marta Colombo", service_name: "Pulizia viso",
      old_starts_at: "2026-09-18T15:00:00+02:00", new_starts_at: "2026-09-19T16:30:00+02:00", cabin: 2,
    },
  };
  const draft = fakeSupabase({
    fn_move_appointment: { data: draftResult, error: null },
    centers: { data: { timezone: "Europe/Rome" }, error: null },
  });
  const r1 = await runTool(
    ALL_TOOLS,
    "move_appointment",
    { id: "a1", new_starts_at: "2026-09-19T16:30:00+02:00", confirmed: false },
    toolBase(draft.client, { role: "receptionist" }),
  );
  assertEquals(r1.ok, true);
  if (r1.ok) {
    const msg = (r1.data as { draft_message: string }).draft_message;
    assertStringIncludes(msg, "Marta Colombo");
    assertStringIncludes(msg, "16:30");
    assertStringIncludes(msg, "va bene?");
  }

  const movedResult = { status: "moved", appointment: { ...draftResult.preview, starts_at: draftResult.preview.new_starts_at } };
  const moved = fakeSupabase({
    fn_move_appointment: { data: movedResult, error: null },
    centers: { data: { timezone: "Europe/Rome" }, error: null },
  });
  const r2 = await runTool(
    ALL_TOOLS,
    "move_appointment",
    { id: "a1", new_starts_at: "2026-09-19T16:30:00+02:00", confirmed: true },
    toolBase(moved.client),
  );
  assertEquals(r2.ok, true);
  if (r2.ok) {
    const msg = (r2.data as { draft_message: string }).draft_message;
    assertStringIncludes(msg, "ti confermo");
  }
  assertEquals(findCall(moved.recorded, "fn_move_appointment")?.calls[0][1], [{
    _center_id: CENTER_ID, _appointment_id: "a1", _new_starts_at: "2026-09-19T16:30:00+02:00", _confirmed: true,
  }]);
});

Deno.test("move_appointment: a conflict is passed through untouched (no centers lookup, no draft_message)", async () => {
  const conflictResult = { status: "conflict", requested: {}, alternatives: [] };
  const { client, recorded } = fakeSupabase({ fn_move_appointment: { data: conflictResult, error: null } });
  const r = await runTool(
    ALL_TOOLS,
    "move_appointment",
    { id: "a1", new_starts_at: "2026-09-19T16:30:00+02:00", confirmed: false },
    toolBase(client),
  );
  assertEquals(r, { ok: true, data: conflictResult });
  assertEquals(findCall(recorded, "centers"), undefined);
});

Deno.test("propose_recall: owner-only; drafts a message from the dormant client picked by the RPC", async () => {
  const { client, recorded } = fakeSupabase({});
  const forbidden = await runTool(
    ALL_TOOLS,
    "propose_recall",
    { gap: { start: "2026-09-18T15:00:00+02:00", end: "2026-09-18T16:30:00+02:00" } },
    toolBase(client, { role: "operator" }),
  );
  assertEquals(forbidden.ok, false);
  assertEquals(recorded.length, 0);

  const proposed = fakeSupabase({
    fn_propose_recall: {
      data: {
        status: "proposed",
        gap: { starts_at: "2026-09-18T15:00:00+02:00", ends_at: "2026-09-18T16:30:00+02:00", cabin: null, minutes: 90 },
        client: { client_key: "giulia bassi", client_name: "Giulia Bassi", visits: 2, last_service: "B", service_duration_minutes: 90 },
      },
      error: null,
    },
    centers: { data: { timezone: "Europe/Rome" }, error: null },
  });
  const r = await runTool(
    ALL_TOOLS,
    "propose_recall",
    { gap: { start: "2026-09-18T15:00:00+02:00", end: "2026-09-18T16:30:00+02:00" } },
    toolBase(proposed.client),
  );
  assertEquals(r.ok, true);
  if (r.ok) {
    const msg = (r.data as { draft_message: string }).draft_message;
    assertStringIncludes(msg, "Giulia Bassi");
    assertStringIncludes(msg, "15:00");
  }
  assertEquals(findCall(proposed.recorded, "fn_propose_recall")?.calls[0][1], [{
    _center_id: CENTER_ID, _gap_start: "2026-09-18T15:00:00+02:00", _gap_end: "2026-09-18T16:30:00+02:00", _cabin: null,
  }]);
});

Deno.test("propose_recall: no_candidate is passed through untouched (no centers lookup)", async () => {
  const { client, recorded } = fakeSupabase({
    fn_propose_recall: { data: { status: "no_candidate", reason: "Nessuna cliente dormiente" }, error: null },
  });
  const r = await runTool(
    ALL_TOOLS,
    "propose_recall",
    { gap: { start: "2026-09-18T15:00:00+02:00", end: "2026-09-18T16:30:00+02:00" } },
    toolBase(client),
  );
  assertEquals(r, { ok: true, data: { status: "no_candidate", reason: "Nessuna cliente dormiente" } });
  assertEquals(findCall(recorded, "centers"), undefined);
});

Deno.test("set_profile_slot: rejects an unknown slot_key before touching center_profile_slots", async () => {
  const { client, recorded } = fakeSupabase({
    profile_slot_catalog: { data: null, error: null },
  });
  const r = await runTool(
    ALL_TOOLS,
    "set_profile_slot",
    { slot_key: "not_real", value: "x", source: "conversation" },
    toolBase(client, { role: "operator" }),
  );
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error.code, "invalid_args");
  assertEquals(findCall(recorded, "center_profile_slots"), undefined);
});

Deno.test("set_profile_slot: upserts with the server-side center and caller as updated_by", async () => {
  const { client, recorded } = fakeSupabase({
    profile_slot_catalog: { data: { slot_key: "tipologia" }, error: null },
    center_profile_slots: {
      data: { slot_key: "tipologia", value: "Centro estetico", source: "conversation", updated_at: "2026-09-22T00:00:00Z" },
      error: null,
    },
  });
  const r = await runTool(
    ALL_TOOLS,
    "set_profile_slot",
    { slot_key: "tipologia", value: "Centro estetico", source: "conversation" },
    toolBase(client, { role: "operator" }),
  );
  assertEquals(r.ok, true);
  if (r.ok) assertEquals((r.data as { value: unknown }).value, "Centro estetico");
  const call = findCall(recorded, "center_profile_slots");
  assertEquals(call?.calls[0], ["upsert", [
    { center_id: CENTER_ID, slot_key: "tipologia", value: "Centro estetico", source: "conversation", updated_by: USER_ID },
    { onConflict: "center_id,slot_key" },
  ]]);
});

Deno.test("set_profile_slot: is not a write tool -- no confirmed field, callable repeatedly in one turn", () => {
  const tool = ALL_TOOLS.find((t) => t.name === "set_profile_slot")!;
  assertEquals(tool.write, false);
  assertEquals(tool.parameters.required?.includes("confirmed"), false);
});

Deno.test("get_missing_slots: missing (no row) and stale (>6 months) both surface, answered-recent does not", async () => {
  const catalog = [
    { slot_key: "a", chapter: "identita", question_number: 1, label: "A", is_welcome_interview: true },
    { slot_key: "b", chapter: "identita", question_number: 2, label: "B", is_welcome_interview: false },
    { slot_key: "c", chapter: "identita", question_number: 3, label: "C", is_welcome_interview: false },
  ];
  const { client } = fakeSupabase({
    profile_slot_catalog: { data: catalog, error: null },
    center_profile_slots: {
      data: [
        { slot_key: "b", updated_at: "2020-01-01T00:00:00Z" }, // stale
        { slot_key: "c", updated_at: "2026-09-01T00:00:00Z" }, // recent, answered
      ],
      error: null,
    },
  });
  const r = await runTool(ALL_TOOLS, "get_missing_slots", {}, toolBase(client, { role: "operator", now: new Date("2026-09-22T00:00:00Z") }));
  assertEquals(r.ok, true);
  if (r.ok) {
    const d = r.data as { missing_count: number; missing: { slot_key: string; reason: string }[] };
    assertEquals(d.missing_count, 2);
    // welcome-interview slot ("a", missing) sorts before the ordinary stale one ("b")
    assertEquals(d.missing.map((m) => m.slot_key), ["a", "b"]);
    assertEquals(d.missing[0].reason, "missing");
    assertEquals(d.missing[1].reason, "stale");
  }
});

Deno.test("get_missing_slots: an invalid chapter is rejected by the schema", async () => {
  const { client, recorded } = fakeSupabase({});
  const r = await runTool(ALL_TOOLS, "get_missing_slots", { chapter: "non_esiste" }, toolBase(client));
  assertEquals(r.ok, false);
  assertEquals(recorded.length, 0);
});

Deno.test("generate_first_reading: owner-only; completeness and per-chapter highlights from the real data", async () => {
  const { client: opClient, recorded: opRecorded } = fakeSupabase({});
  const forbidden = await runTool(ALL_TOOLS, "generate_first_reading", {}, toolBase(opClient, { role: "operator" }));
  assertEquals(forbidden.ok, false);
  assertEquals(opRecorded.length, 0);

  const catalog = [
    { slot_key: "tipologia", chapter: "identita", label: "Tipologia", is_welcome_interview: true },
    { slot_key: "dimensioni", chapter: "identita", label: "Dimensioni", is_welcome_interview: true },
    { slot_key: "obiettivi_futuri", chapter: "obiettivi", label: "Obiettivi", is_welcome_interview: true },
  ];
  const { client } = fakeSupabase({
    profile_slot_catalog: { data: catalog, error: null },
    center_profile_slots: { data: [{ slot_key: "tipologia", value: "Centro estetico" }], error: null },
  });
  const r = await runTool(ALL_TOOLS, "generate_first_reading", {}, toolBase(client));
  assertEquals(r.ok, true);
  if (r.ok) {
    const d = r.data as {
      completeness_pct: number;
      chapters: { chapter: string; answered_count: number; total_count: number; highlights: unknown[] }[];
      missing_welcome_slots: string[];
    };
    // 1 of 3 welcome slots answered, all weight 3 -> 3 of 9 -> 33%
    assertEquals(d.completeness_pct, 33);
    const identita = d.chapters.find((c) => c.chapter === "identita")!;
    assertEquals(identita.answered_count, 1);
    assertEquals(identita.total_count, 2);
    assertEquals(identita.highlights, [{ label: "Tipologia", value: "Centro estetico" }]);
    assertEquals(d.missing_welcome_slots, ["Dimensioni", "Obiettivi"]);
  }
});

Deno.test("get_latest_report: owner-only; the newest report plus its actions split by kind", async () => {
  const { client: opClient, recorded: opRecorded } = fakeSupabase({});
  const forbidden = await runTool(ALL_TOOLS, "get_latest_report", {}, toolBase(opClient, { role: "operator" }));
  assertEquals(forbidden.ok, false);
  assertEquals(opRecorded.length, 0);

  const { client } = fakeSupabase({
    center_reports: {
      data: {
        id: "r1", period_start: "2026-09-16", period_end: "2026-09-22",
        kpi_snapshot: [{ metric_key: "avg_ticket_7d", value: 61, status: "ok" }],
        diagnostic_narrative: "Va bene.", generated_at: "2026-09-22T08:00:00Z",
      },
      error: null,
    },
    center_actions: {
      data: [
        { id: "a1", kind: "urgent", number: 1, action_text: "Richiama le dormienti", done: false },
        { id: "a2", kind: "strategic", number: 1, action_text: "Rivedi il listino", done: true },
      ],
      error: null,
    },
  });
  const r = await runTool(ALL_TOOLS, "get_latest_report", {}, toolBase(client));
  assertEquals(r.ok, true);
  if (r.ok) {
    const d = r.data as { report: { id: string }; urgent_actions: unknown[]; strategic_actions: unknown[] };
    assertEquals(d.report.id, "r1");
    assertEquals(d.urgent_actions.length, 1);
    assertEquals(d.strategic_actions.length, 1);
  }
});

Deno.test("get_latest_report: no report yet -> not_found", async () => {
  const { client } = fakeSupabase({ center_reports: { data: null, error: null } });
  const r = await runTool(ALL_TOOLS, "get_latest_report", {}, toolBase(client));
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error.code, "not_found");
});

Deno.test("set_action_done: draft previews without writing, confirmed writes and stamps done_at", async () => {
  const actionRow = {
    id: "a1", center_id: CENTER_ID, kind: "urgent", number: 1, action_text: "Richiama le dormienti", done: false, done_at: null,
  };

  const draft = fakeSupabase({ center_actions: { data: actionRow, error: null } });
  const r1 = await runTool(ALL_TOOLS, "set_action_done", { action_id: "a1", done: true, confirmed: false }, toolBase(draft.client));
  assertEquals(r1.ok, true);
  if (r1.ok) assertEquals((r1.data as { status: string }).status, "draft");
  // the maybeSingle() lookup happens, but no .update() call should have fired
  assertEquals(draft.recorded.some((c) => c.calls.some(([m]) => m === "update")), false);

  // The fake resolves every query against "center_actions" (both the initial lookup and the
  // update's own .select()) to the SAME canned row, so this represents what the row looks like
  // AFTER the write -- the meaningful assertion is on what .update() was actually called with,
  // not on the fake's returned shape (it can't simulate a real mutation).
  const updated = fakeSupabase({ center_actions: { data: { ...actionRow, done: true, done_at: "2026-09-22T00:00:00Z" }, error: null } });
  const r2 = await runTool(ALL_TOOLS, "set_action_done", { action_id: "a1", done: true, confirmed: true }, toolBase(updated.client));
  assertEquals(r2.ok, true);
  if (r2.ok) assertEquals((r2.data as { status: string }).status, "updated");
  const updateCall = findCall(updated.recorded, "center_actions")?.calls.find(([m]) => m === "update");
  assertEquals((updateCall?.[1][0] as { done: boolean }).done, true);
  assertEquals(typeof (updateCall?.[1][0] as { done_at: string }).done_at, "string");
});

Deno.test("set_action_done: an action from another center is invalid_args, not a cross-tenant leak", async () => {
  const { client } = fakeSupabase({ center_actions: { data: null, error: null } });
  const r = await runTool(ALL_TOOLS, "set_action_done", { action_id: "a1", done: true, confirmed: false }, toolBase(client));
  assertEquals(r.ok, false);
  if (!r.ok) assertEquals(r.error.code, "invalid_args");
});
