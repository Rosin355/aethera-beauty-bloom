import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ToolBase } from "./tools/run.ts";

export interface FakeResult {
  data: unknown;
  error: { code?: string; message?: string } | null;
}

export interface RecordedCall {
  kind: "from" | "rpc";
  name: string;
  calls: [string, unknown[]][];
}

/**
 * Minimal supabase-js double: every query-builder method is recorded and chainable, terminal
 * `maybeSingle()`/`single()`/await resolve to the canned result registered for the table or rpc name.
 */
export const fakeSupabase = (results: Record<string, FakeResult | (() => FakeResult)>) => {
  const recorded: RecordedCall[] = [];
  const resolve = (name: string): FakeResult => {
    const entry = results[name];
    if (!entry) return { data: null, error: { code: "TEST", message: `no canned result for ${name}` } };
    return typeof entry === "function" ? entry() : entry;
  };

  const chain = (record: RecordedCall) => {
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "order", "limit", "in", "gte", "lte", "neq", "insert", "update", "upsert"]) {
      builder[method] = (...args: unknown[]) => {
        record.calls.push([method, args]);
        return builder;
      };
    }
    builder.maybeSingle = () => Promise.resolve(resolve(record.name));
    builder.single = () => Promise.resolve(resolve(record.name));
    builder.then = (onOk: (v: FakeResult) => unknown, onErr: (e: unknown) => unknown) =>
      Promise.resolve(resolve(record.name)).then(onOk, onErr);
    return builder;
  };

  const client = {
    from(table: string) {
      const record: RecordedCall = { kind: "from", name: table, calls: [] };
      recorded.push(record);
      return chain(record);
    },
    rpc(name: string, args: unknown) {
      const record: RecordedCall = { kind: "rpc", name, calls: [["args", [args]]] };
      recorded.push(record);
      return Promise.resolve(resolve(name));
    },
  };

  return { client: client as unknown as SupabaseClient, recorded };
};

export const CENTER_ID = "aaaaaaaa-0000-4000-8000-000000000001";
export const USER_ID = "11111111-1111-4111-8111-111111111111";

export const toolBase = (
  supabase: SupabaseClient,
  overrides: Partial<ToolBase> = {},
): ToolBase => ({
  supabase,
  centerId: CENTER_ID,
  userId: USER_ID,
  role: "owner",
  now: new Date("2026-09-16T10:00:00Z"),
  knowledge: { search: () => Promise.resolve([]) },
  ...overrides,
});
