import { unwrap } from "./db.ts";
import { defineTool } from "./types.ts";

const STALE_AFTER_DAYS = 182; // ~6 months
// The whole catalogue is 75 questions with long labels, so an unanswered center serialises well
// past run.ts's 6 KB cap and the model gets a truncated string blob instead of a list -- worst
// exactly on a brand-new center, which is when this tool is for. The list is already sorted with
// the welcome-interview slots first, so the head of it is the right slice to keep; missing_count
// still reports the true total.
const MAX_MISSING = 15;

interface SlotCatalogRow {
  slot_key: string;
  chapter: string;
  question_number: number;
  label: string;
  is_welcome_interview: boolean;
}

interface AnsweredSlotRow {
  slot_key: string;
  updated_at: string;
}

const CHAPTERS = ["identita", "gestione", "numeri", "clienti", "marketing", "team", "obiettivi"] as const;

/**
 * So the concierge asks ONLY for what it doesn't already know, or hasn't heard about in a
 * while (P1.5). A slot is "missing" with no row at all, "stale" if its own row is older than
 * ~6 months — either way it's a candidate to ask about; "answered" (recent) is never returned.
 */
export const getMissingSlots = defineTool<{ chapter?: string }>({
  name: "get_missing_slots",
  description:
    "Elenca gli slot dell'Analisi di Valore ancora mancanti o non aggiornati da più di 6 mesi, " +
    "in ordine di priorità (i più prioritari prima). Usalo per scegliere la prossima domanda da " +
    "fare — mai domande su slot già risposti di recente.",
  parameters: {
    type: "object",
    properties: {
      chapter: {
        type: "string",
        enum: CHAPTERS,
        description: "Limita a un capitolo; se omesso, tutti.",
      },
    },
    additionalProperties: false,
  },
  access: "member",
  write: false,
  async handler({ supabase, centerId, args, now }) {
    let catalogQuery = supabase
      .from("profile_slot_catalog")
      .select("slot_key, chapter, question_number, label, is_welcome_interview")
      .order("sort_order");
    if (args.chapter) catalogQuery = catalogQuery.eq("chapter", args.chapter);

    const [catalogRes, answeredRes] = await Promise.all([
      catalogQuery,
      supabase.from("center_profile_slots").select("slot_key, updated_at").eq("center_id", centerId),
    ]);
    const catalog = unwrap<SlotCatalogRow[]>(catalogRes) ?? [];
    const answered = unwrap<AnsweredSlotRow[]>(answeredRes) ?? [];

    const updatedByKey = new Map(answered.map((row) => [row.slot_key, row.updated_at]));
    const staleCutoff = now.getTime() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;

    const missing: (SlotCatalogRow & { reason: "missing" | "stale" })[] = [];
    for (const slot of catalog) {
      const updatedAt = updatedByKey.get(slot.slot_key);
      if (updatedAt === undefined) {
        missing.push({ ...slot, reason: "missing" });
      } else if (new Date(updatedAt).getTime() < staleCutoff) {
        missing.push({ ...slot, reason: "stale" });
      }
    }
    // Welcome-interview slots first, then by the questionnaire's own order.
    missing.sort((a, b) =>
      Number(b.is_welcome_interview) - Number(a.is_welcome_interview) || a.question_number - b.question_number
    );

    return {
      chapter: args.chapter ?? null,
      missing_count: missing.length,
      missing: missing.slice(0, MAX_MISSING),
    };
  },
});
