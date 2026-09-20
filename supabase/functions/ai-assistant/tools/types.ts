import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { CenterRole } from "../../_shared/center.ts";

export type { CenterRole };

/** JSON-Schema subset understood by `schema.ts` (and sent to the model as `parameters`). */
export interface JsonSchema {
  type?: "object" | "string" | "integer" | "number" | "boolean" | "array";
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  /** Objects are strict by default: unknown properties are rejected unless this is `true`. */
  additionalProperties?: boolean;
  enum?: readonly (string | number | boolean)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: "date" | "date-time" | "uuid";
  items?: JsonSchema;
  maxItems?: number;
}

export interface KbDoc {
  title: string;
  description: string | null;
  content: string;
}

export interface ToolContext<A = Record<string, unknown>> {
  /** USER-scoped client (anon key + caller JWT): RLS and auth.uid() apply. Never the service role. */
  supabase: SupabaseClient;
  /** Resolved server-side from the caller's memberships; never taken from model output. */
  centerId: string;
  userId: string;
  role: CenterRole;
  /** Already validated against the tool's schema. */
  args: A;
  now: Date;
  /** The only privileged capability: lexical search over the global KB (service-role RPC behind it). */
  knowledge: { search(query: string, limit?: number): Promise<KbDoc[]> };
}

export type ToolErrorCode =
  | "invalid_args"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "unknown_tool"
  | "too_many_calls"
  | "too_large"
  | "internal";

export class ToolError extends Error {
  code: ToolErrorCode;
  constructor(code: ToolErrorCode, message: string) {
    super(message);
    this.name = "ToolError";
    this.code = code;
  }
}

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: { code: ToolErrorCode; message: string } };

export interface Tool {
  /** snake_case, unique. */
  name: string;
  /** Italian; tells the model WHEN to call it. */
  description: string;
  /** No center/user ids in here: tenant identity comes from the ToolContext only. */
  parameters: JsonSchema;
  /** Minimum center role. The registry hides tools the role cannot use and the runner re-checks. */
  access: "member" | "owner";
  /** true => the schema must declare a required boolean `confirmed` (P1.4). */
  write: boolean;
  handler(ctx: ToolContext): Promise<unknown>;
}

/**
 * Declare a tool with typed args. The handler receives args already validated against `parameters`,
 * so the cast inside is the single place where "validated JSON" becomes `A`.
 */
export const defineTool = <A>(tool: {
  name: string;
  description: string;
  parameters: JsonSchema;
  access: "member" | "owner";
  write: boolean;
  handler(ctx: ToolContext<A>): Promise<unknown>;
}): Tool => ({
  ...tool,
  handler: (ctx) => tool.handler(ctx as unknown as ToolContext<A>),
});
