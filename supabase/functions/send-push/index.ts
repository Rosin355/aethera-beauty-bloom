import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient, HttpError, toErrorResponse, type ServiceClient } from "../_shared/auth.ts";
import { readJsonBody } from "../_shared/security.ts";
import { apnsConfigFromEnv, isTerminalApnsFailure, sendApnsPush, signApnsJwt, type ApnsConfig } from "./apns.ts";

// P1.7 (2/3): service role, internal only -- called by the pg_cron scheduler (via pg_net) and,
// later, by other backend code that needs to push (never by the app or an end user directly).
// FCM/Android is explicitly out of scope for this phase ("FCM later" in the prompt doc): android
// tokens are looked up and reported back as skipped, nothing is sent to them yet.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BODY_BYTES = 4 * 1024;

interface RequestBody {
  centerId?: unknown;
  title?: unknown;
  body?: unknown;
  data?: unknown;
}

interface DeviceTokenRow {
  id: string;
  platform: "ios" | "android";
  token: string;
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** True only for the project's own service-role key -- the one credential a normal user, or a
 * stolen user access token, can never hold. This is the whole "internal only" gate. */
const isServiceRoleCaller = (bearerToken: string): boolean => {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return !!serviceKey && bearerToken === serviceKey;
};

/**
 * The helper the prompt doc asks for: push every iOS device registered to `centerId`. Exported
 * so a future caller within this function's own bundle (there is no cross-function import in
 * this codebase, see CLAUDE.md) can reuse it without going through HTTP.
 */
export const notifyCenter = async (
  supabase: ServiceClient,
  apns: ApnsConfig,
  centerId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<{ sent: number; failed: number; skipped_android: number }> => {
  const { data: tokens, error } = await supabase
    .from("device_tokens")
    .select("id, platform, token")
    .eq("center_id", centerId);
  if (error) throw new HttpError(500, "Errore lettura device_tokens");

  const rows = (tokens ?? []) as DeviceTokenRow[];
  const iosTokens = rows.filter((t) => t.platform === "ios");
  const androidCount = rows.length - iosTokens.length;
  if (iosTokens.length === 0) return { sent: 0, failed: 0, skipped_android: androidCount };

  const jwt = await signApnsJwt(apns);
  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];

  for (const row of iosTokens) {
    const result = await sendApnsPush(apns, jwt, row.token, title, body, data);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      console.error("send-push: APNs rejected a token", result.status, result.reason ?? "");
      if (isTerminalApnsFailure(result)) staleIds.push(row.id);
    }
  }

  if (staleIds.length > 0) {
    await supabase.from("device_tokens").delete().in("id", staleIds);
  }

  return { sent, failed, skipped_android: androidCount };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") throw new HttpError(405, "Metodo non consentito");

    const authHeader = req.headers.get("authorization") ?? "";
    const [scheme, bearerToken] = authHeader.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !bearerToken || !isServiceRoleCaller(bearerToken)) {
      throw new HttpError(403, "send-push è solo per uso interno");
    }

    const body = await readJsonBody<RequestBody>(req, MAX_BODY_BYTES);
    if (
      typeof body !== "object" || body === null ||
      typeof body.centerId !== "string" ||
      typeof body.title !== "string" || body.title.trim() === "" ||
      typeof body.body !== "string" || body.body.trim() === "" ||
      (body.data !== undefined && (typeof body.data !== "object" || body.data === null || Array.isArray(body.data)))
    ) {
      throw new HttpError(400, "Corpo della richiesta non valido");
    }

    const apns = apnsConfigFromEnv();
    if (!apns) throw new HttpError(500, "Configurazione APNs non valida");

    const supabase = createServiceClient();
    const result = await notifyCenter(
      supabase,
      apns,
      body.centerId,
      body.title,
      body.body,
      (body.data as Record<string, unknown> | undefined) ?? {},
    );

    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    if (!(error instanceof HttpError)) console.error("Error in send-push");
    return toErrorResponse(error, corsHeaders);
  }
});
