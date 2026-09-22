import { unwrap } from "./db.ts";
import { computeCompleteness, type CatalogSlot } from "./profile_completeness.ts";
import { defineTool, ToolError } from "./types.ts";

const MAX_SERVICES = 30;
const MAX_SLOTS = 100;

interface CenterRow {
  name: string;
  timezone: string;
  cabin_count: number;
  opening_hours: unknown;
}

/** Postgres / PostgREST codes for "table does not exist" (slots tables arrive with P1.5). */
const isMissingTable = (code: string | undefined): boolean => code === "42P01" || code === "PGRST205";

/** Any member: who the center is (setup, services, team size) and the Analisi di Valore slots known so far. */
export const getCenterProfile = defineTool<Record<string, never>>({
  name: "get_center_profile",
  description:
    "Restituisce il profilo del centro: nome, fuso, numero di cabine, orari di apertura, servizi attivi, " +
    "composizione del team e i dati dell'Analisi di Valore già raccolti (slot del profilo). " +
    "Usalo per personalizzare i consigli e prima di fare domande: non chiedere ciò che già sai.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  access: "member",
  write: false,
  async handler({ supabase, centerId }) {
    const center = unwrap<CenterRow>(
      await supabase
        .from("centers")
        .select("name, timezone, cabin_count, opening_hours")
        .eq("id", centerId)
        .maybeSingle(),
    );
    if (!center) throw new ToolError("not_found", "Centro non trovato");

    const [servicesRes, membersRes, slotsRes, catalogRes] = await Promise.all([
      supabase
        .from("business_services")
        .select("name, category, price, duration_minutes")
        .eq("center_id", centerId)
        .eq("is_active", true)
        .order("category")
        .order("name")
        .limit(MAX_SERVICES + 1),
      supabase.from("center_members").select("role").eq("center_id", centerId).eq("status", "active"),
      supabase
        .from("center_profile_slots")
        .select("slot_key, value, source, updated_at")
        .eq("center_id", centerId)
        .limit(MAX_SLOTS),
      supabase.from("profile_slot_catalog").select("slot_key, is_welcome_interview"),
    ]);

    const services = unwrap<{ name: string; category: string; price: number; duration_minutes: number }[]>(servicesRes) ?? [];
    const members = unwrap<{ role: string }[]>(membersRes) ?? [];

    let slots: { slot_key: string; value: unknown; source: string; updated_at: string }[] | null = null;
    if (slotsRes.error) {
      if (!isMissingTable(slotsRes.error.code)) unwrap(slotsRes); // any other failure is a real error
    } else {
      slots = slotsRes.data ?? [];
    }

    let catalog: CatalogSlot[] | null = null;
    if (catalogRes.error) {
      if (!isMissingTable(catalogRes.error.code)) unwrap(catalogRes);
    } else {
      catalog = catalogRes.data ?? [];
    }

    const team: Record<string, number> = { owner: 0, operator: 0, receptionist: 0 };
    for (const m of members) team[m.role] = (team[m.role] ?? 0) + 1;

    const completeness = catalog && slots
      ? computeCompleteness(catalog, new Set(slots.map((s) => s.slot_key)))
      : null;

    return {
      center: {
        name: center.name,
        timezone: center.timezone,
        cabin_count: center.cabin_count,
        opening_hours: center.opening_hours,
      },
      team,
      services: {
        categories: [...new Set(services.map((s) => s.category))],
        items: services.slice(0, MAX_SERVICES),
        truncated: services.length > MAX_SERVICES,
      },
      slots_available: slots !== null,
      slots,
      completeness_pct: completeness?.percent ?? null,
    };
  },
});
