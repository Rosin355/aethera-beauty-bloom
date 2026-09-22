import { localDayTime, unwrap } from "./db.ts";
import { defineTool, ToolError } from "./types.ts";

interface ProposeRecallArgs {
  gap: { start: string; end: string; cabin?: number };
}

interface RecallClient {
  client_name: string;
  last_service: string | null;
}

/**
 * Owner-only, NOT a write tool: picks the best-fit dormant client for a free slot (loyalty then
 * recency, filtered to a service whose duration fits the gap) and drafts a recall message. Never
 * writes or sends anything itself — the app/model shows the draft for approval, same as any
 * other draft-message pattern (see DraftMessageCard-equivalent in the native clients).
 */
export const proposeRecall = defineTool<ProposeRecallArgs>({
  name: "propose_recall",
  description:
    "Per un buco libero in agenda, sceglie la cliente dormiente più adatta (in base allo storico " +
    "e a un servizio che entra nel buco) e prepara un messaggio di richiamo da mostrare per " +
    "l'approvazione. Non scrive né invia nulla da solo.",
  parameters: {
    type: "object",
    properties: {
      gap: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" },
          cabin: { type: "integer", minimum: 1, maximum: 20 },
        },
        required: ["start", "end"],
        additionalProperties: false,
      },
    },
    required: ["gap"],
    additionalProperties: false,
  },
  access: "owner",
  write: false,
  async handler({ supabase, centerId, args }) {
    const result = unwrap<Record<string, unknown>>(
      await supabase.rpc("fn_propose_recall", {
        _center_id: centerId,
        _gap_start: args.gap.start,
        _gap_end: args.gap.end,
        _cabin: args.gap.cabin ?? null,
      }),
    );
    if (!result) throw new ToolError("internal", "Nessun risultato dallo strumento");
    if (result.status !== "proposed") return result;

    const client = result.client as RecallClient;
    const gap = result.gap as { starts_at: string };
    const center = unwrap<{ timezone: string }>(
      await supabase.from("centers").select("timezone").eq("id", centerId).maybeSingle(),
    );
    const when = localDayTime(gap.starts_at, center?.timezone || "Europe/Rome");
    const service = client.last_service ?? "un trattamento";

    return {
      ...result,
      draft_message:
        `Ciao ${client.client_name}, ci manchi! Ho tenuto libero un posto ${when} per ${service}. ` +
        `Ti va di tornare a trovarci?`,
    };
  },
});
