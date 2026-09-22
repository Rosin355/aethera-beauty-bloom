import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createUserClient,
  getBearerToken,
  HttpError,
  requireAuthenticatedUser,
  toErrorResponse,
} from "../_shared/auth.ts";
import { resolveCenterAccess } from "../_shared/center.ts";
import { readJsonBody } from "../_shared/security.ts";

// P1.6: assembles the "lettura del centro" -- a KPI snapshot with semaphore levels plus a
// model-written diagnostic narrative -- and stores it as one center_reports row + 10
// center_actions rows (5 urgent, 5 strategic). Owner-only: see the migration's own header
// comment for why this deviates from the prompt doc's looser "center member" wording.
//
// NOT part of the ai-assistant tool-calling framework: this is a single one-shot model call with
// a JSON response format, not a streamed chat turn, so it does not reuse ai-assistant/llm.ts's
// SSE machinery. The small pieces that WOULD be shared (gateway URL/model from env, the
// 429/402 mapping) are duplicated here rather than importing across function directories or
// refactoring the already-shipped, already-tested ai-assistant/llm.ts under a "cannot run tests
// in this sandbox" constraint -- flagged as a candidate for a real _shared/llm.ts extraction at
// the P1.7 security pass, not attempted blind here.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BODY_BYTES = 4 * 1024;

interface RequestBody {
  centerId?: unknown;
}

interface KpiRow {
  as_of: string;
  window_start: string;
  revenue_7d: number | null;
  avg_ticket_7d: number | null;
  hours_open_7d: number | null;
  occupancy_pct_7d: number | null;
  rebooking_pct_30d: number | null;
  dormant_clients_count: number | null;
}

interface ThresholdRow {
  metric_key: string;
  label: string;
  unit: string;
  higher_is_better: boolean;
  ok_threshold: number;
  watch_threshold: number;
}

type Status = "ok" | "watch" | "act" | "unknown";

interface Indicator {
  metric_key: string;
  label: string;
  value: number | null;
  unit: string;
  status: Status;
}

interface ModelOutput {
  diagnostic_narrative: string;
  urgent_actions: string[];
  strategic_actions: string[];
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const statusFor = (value: number | null, t: ThresholdRow): Status => {
  if (value === null) return "unknown";
  if (t.higher_is_better) {
    if (value >= t.ok_threshold) return "ok";
    if (value >= t.watch_threshold) return "watch";
    return "act";
  }
  if (value <= t.ok_threshold) return "ok";
  if (value <= t.watch_threshold) return "watch";
  return "act";
};

// The native clients render this as typeset editorial prose (CLAUDE.md): no markdown renderer.
// This function bypasses ai-assistant's context.ts entirely (a separate one-shot call, not a
// chat turn), so its own prompt has to carry the same rule -- see that file's
// RESPONSE_STYLE_INSTRUCTIONS for the sibling copy this is kept in sync with by hand.
const NARRATIVE_STYLE =
  "Scrivi in prosa semplice, mai in markdown: niente grassetto, elenchi puntati o numerati, titoli, tabelle. " +
  "Paragrafi brevi. I numeri vanno scritti dentro la frase, mai isolati in una tabella o in un elenco.";

const buildPrompt = (centerName: string, indicators: Indicator[], kb: string[]): string => {
  const kpiLines = indicators
    .map((i) => `- ${i.label}: ${i.value === null ? "dato non disponibile" : `${i.value}${i.unit}`} (${i.status})`)
    .join("\n");
  const kbBlock = kb.length > 0 ? `\n\nMATERIALE DI RIFERIMENTO (Metodo 4 Elementi):\n${kb.join("\n---\n")}` : "";

  return `Sei l'assistente AI di 4 Elementi Italia. Scrivi la "lettura del centro" di ${centerName}, un'analisi di benessere aziendale.

DATI REALI DEGLI ULTIMI 7 GIORNI:
${kpiLines}
${kbBlock}

Scrivi tre cose:
1. diagnostic_narrative: un commento diagnostico di 2-4 paragrafi che legge questi numeri insieme -- cosa va bene, cosa va guardato, cosa richiede un'azione -- in tono professionale, caldo, mai giudicante. Basati SOLO sui dati reali sopra: non inventare cifre che non ci sono, e se un dato non è disponibile dillo con onestà.
2. urgent_actions: esattamente 5 azioni concrete da fare nei prossimi 30 giorni, una frase ciascuna.
3. strategic_actions: esattamente 5 azioni concrete per i prossimi 3-6 mesi, una frase ciascuna.

${NARRATIVE_STYLE}

Rispondi in italiano, SOLO con questo oggetto JSON, senza altro testo prima o dopo:
{"diagnostic_narrative": "...", "urgent_actions": ["...","...","...","...","..."], "strategic_actions": ["...","...","...","...","..."]}`;
};

const isNonEmptyStringArray = (value: unknown, length: number): value is string[] =>
  Array.isArray(value) && value.length === length && value.every((v) => typeof v === "string" && v.trim() !== "");

const parseModelOutput = (raw: string): ModelOutput => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpError(502, "Risposta del modello non in formato JSON valido");
  }
  const p = parsed as Partial<ModelOutput> | null;
  if (
    typeof p !== "object" || p === null ||
    typeof p.diagnostic_narrative !== "string" || p.diagnostic_narrative.trim() === "" ||
    !isNonEmptyStringArray(p.urgent_actions, 5) ||
    !isNonEmptyStringArray(p.strategic_actions, 5)
  ) {
    throw new HttpError(502, "Il referto generato non ha il formato atteso");
  }
  return { diagnostic_narrative: p.diagnostic_narrative.trim(), urgent_actions: p.urgent_actions, strategic_actions: p.strategic_actions };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") throw new HttpError(405, "Metodo non consentito");

    const { supabase, user } = await requireAuthenticatedUser(req);
    const userClient = createUserClient(getBearerToken(req));
    const body = await readJsonBody<RequestBody>(req, MAX_BODY_BYTES);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new HttpError(400, "Corpo della richiesta non valido");
    }

    // Tenant identity resolved from the caller's own memberships (RLS), never from the model.
    const center = await resolveCenterAccess(userClient, user.id, body.centerId);
    if (!center) throw new HttpError(400, "Nessun centro attivo per questo utente");
    if (center.role !== "owner") throw new HttpError(403, "Solo la titolare può generare il referto");

    // Same owner-gated wrapper ai-assistant's get_center_kpi tool reads -- one source of truth
    // for "what counts as this week's numbers", through the user-scoped client so RLS/ownership
    // is enforced twice (here explicitly, and again inside the function itself).
    const { data: kpiRows, error: kpiError } = await userClient.rpc("fn_center_kpi", { _center_id: center.centerId });
    if (kpiError) {
      console.error("generate-report: fn_center_kpi failed", kpiError.code);
      throw new HttpError(500, "Errore nella lettura dei KPI");
    }
    const kpi = (kpiRows as KpiRow[] | null)?.[0];
    if (!kpi) throw new HttpError(404, "Dati del centro non disponibili");

    const { data: thresholdRows, error: thresholdsError } = await userClient
      .from("report_thresholds")
      .select("metric_key, label, unit, higher_is_better, ok_threshold, watch_threshold");
    if (thresholdsError) {
      console.error("generate-report: report_thresholds read failed", thresholdsError.code);
      throw new HttpError(500, "Errore nella lettura delle soglie");
    }
    const thresholdByKey = new Map(((thresholdRows ?? []) as ThresholdRow[]).map((t) => [t.metric_key, t]));

    const revenuePerHour = kpi.hours_open_7d && kpi.hours_open_7d > 0
      ? Math.round(((kpi.revenue_7d ?? 0) / kpi.hours_open_7d) * 100) / 100
      : null;
    const rawValues: Record<string, number | null> = {
      avg_ticket_7d: kpi.avg_ticket_7d,
      occupancy_pct_7d: kpi.occupancy_pct_7d,
      rebooking_pct_30d: kpi.rebooking_pct_30d,
      revenue_per_hour_7d: revenuePerHour,
      dormant_clients_count: kpi.dormant_clients_count,
    };

    const indicators: Indicator[] = [];
    for (const [key, value] of Object.entries(rawValues)) {
      const t = thresholdByKey.get(key);
      if (!t) continue; // an admin removed the threshold row: skip rather than guess a band
      indicators.push({ metric_key: key, label: t.label, value, unit: t.unit, status: statusFor(value, t) });
    }

    // KB context for the narrative -- the same service-role-only RPC ai-assistant's
    // ctx.knowledge wraps, called directly here since this function is outside that framework.
    const { data: kbRows } = await supabase.rpc("match_training_data_fts", {
      query_text: "analisi benessere aziendale diagnosi centro estetico",
      match_count: 3,
    });
    const kbSnippets = ((kbRows ?? []) as { title: string; content: string }[])
      .map((d) => `${d.title}: ${d.content.slice(0, 1200)}`);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new HttpError(500, "Configurazione AI non valida");
    const gatewayUrl = Deno.env.get("LLM_GATEWAY_URL") ?? "https://ai.gateway.lovable.dev/v1/chat/completions";
    const model = Deno.env.get("AI_MODEL") ?? "google/gemini-2.5-flash";

    const prompt = buildPrompt(center.centerName ?? "il centro", indicators, kbSnippets);
    const modelResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!modelResponse.ok) {
      await modelResponse.text(); // drain; never surfaced to the caller
      console.error("generate-report: gateway error", modelResponse.status);
      if (modelResponse.status === 429) return jsonResponse({ error: "Limite richieste superato. Riprova tra qualche secondo." }, 429);
      if (modelResponse.status === 402) return jsonResponse({ error: "Crediti AI esauriti. Contatta l'amministratore." }, 402);
      throw new HttpError(502, "Errore nella generazione del referto");
    }

    const modelJson = await modelResponse.json();
    const rawContent = modelJson?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string") throw new HttpError(502, "Risposta del modello non valida");
    const output = parseModelOutput(rawContent);

    const periodStart = kpi.window_start.slice(0, 10);
    const periodEnd = kpi.as_of.slice(0, 10);

    const { data: report, error: reportError } = await supabase
      .from("center_reports")
      .insert({
        center_id: center.centerId,
        period_start: periodStart,
        period_end: periodEnd,
        kpi_snapshot: indicators,
        diagnostic_narrative: output.diagnostic_narrative,
        generated_by: user.id,
      })
      .select("id, period_start, period_end, kpi_snapshot, diagnostic_narrative, generated_at")
      .single();
    if (reportError || !report) {
      console.error("generate-report: insert center_reports failed");
      throw new HttpError(500, "Errore nel salvataggio del referto");
    }

    const actionRows = [
      ...output.urgent_actions.map((text, i) => ({
        report_id: report.id,
        center_id: center.centerId,
        kind: "urgent",
        number: i + 1,
        action_text: text.trim(),
      })),
      ...output.strategic_actions.map((text, i) => ({
        report_id: report.id,
        center_id: center.centerId,
        kind: "strategic",
        number: i + 1,
        action_text: text.trim(),
      })),
    ];
    const { data: actions, error: actionsError } = await supabase
      .from("center_actions")
      .insert(actionRows)
      .select("id, kind, number, action_text, done");
    if (actionsError) {
      console.error("generate-report: insert center_actions failed");
      throw new HttpError(500, "Errore nel salvataggio delle azioni");
    }

    return jsonResponse({ ok: true, report, actions });
  } catch (error) {
    if (!(error instanceof HttpError)) console.error("Error in generate-report");
    return toErrorResponse(error, corsHeaders);
  }
});
