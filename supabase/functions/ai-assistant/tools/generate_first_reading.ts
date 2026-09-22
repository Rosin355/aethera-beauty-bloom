import { unwrap } from "./db.ts";
import { computeCompleteness } from "./profile_completeness.ts";
import { defineTool, ToolError } from "./types.ts";

interface SlotCatalogRow {
  slot_key: string;
  chapter: string;
  label: string;
  is_welcome_interview: boolean;
}

interface AnsweredSlotRow {
  slot_key: string;
  value: unknown;
}

const CHAPTER_LABELS: Record<string, string> = {
  identita: "Identità",
  gestione: "Gestione",
  numeri: "Numeri",
  clienti: "Clienti",
  marketing: "Marketing",
  team: "Team",
  obiettivi: "Obiettivi",
};
const CHAPTER_ORDER = Object.keys(CHAPTER_LABELS);

/**
 * Owner-only, read-only (P1.5): assembles what the "prima lettura" needs — completeness,
 * answered highlights per chapter, still-missing welcome-interview slots — for the MODEL to
 * narrate as the closing letter of the welcome interview. The tool returns data, never prose:
 * same "tools return data, the model speaks it" split as every other tool in this framework.
 */
export const generateFirstReading = defineTool<Record<string, never>>({
  name: "generate_first_reading",
  description:
    "Prepara i dati per la 'prima lettura' del centro dopo l'intervista di benvenuto: quanto è " +
    "completo il profilo, cosa hai già capito per ciascun capitolo, cosa manca ancora delle 8 " +
    "domande prioritarie. Usa questi dati per scrivere tu la lettera di chiusura in prosa.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  access: "owner",
  write: false,
  async handler({ supabase, centerId }) {
    const [catalogRes, answeredRes] = await Promise.all([
      supabase
        .from("profile_slot_catalog")
        .select("slot_key, chapter, label, is_welcome_interview")
        .order("sort_order"),
      supabase.from("center_profile_slots").select("slot_key, value").eq("center_id", centerId),
    ]);
    const catalog = unwrap<SlotCatalogRow[]>(catalogRes);
    const answered = unwrap<AnsweredSlotRow[]>(answeredRes);
    if (!catalog) throw new ToolError("internal", "Catalogo slot non disponibile");

    const answeredByKey = new Map((answered ?? []).map((row) => [row.slot_key, row.value]));
    const completeness = computeCompleteness(catalog, new Set(answeredByKey.keys()));

    const chapters = CHAPTER_ORDER.map((chapter) => {
      const slots = catalog.filter((s) => s.chapter === chapter);
      const answeredSlots = slots.filter((s) => answeredByKey.has(s.slot_key));
      return {
        chapter,
        label: CHAPTER_LABELS[chapter],
        answered_count: answeredSlots.length,
        total_count: slots.length,
        highlights: answeredSlots.slice(0, 6).map((s) => ({ label: s.label, value: answeredByKey.get(s.slot_key) })),
      };
    });

    const missingWelcomeSlots = catalog
      .filter((s) => s.is_welcome_interview && !answeredByKey.has(s.slot_key))
      .map((s) => s.label);

    return {
      completeness_pct: completeness.percent,
      chapters,
      missing_welcome_slots: missingWelcomeSlots,
    };
  },
});
