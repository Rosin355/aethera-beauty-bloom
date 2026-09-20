import { unwrap } from "./db.ts";
import { defineTool, ToolError } from "./types.ts";

const MAX_DORMANT = 10;

interface KpiRow {
  center_id: string;
  dormant_clients: unknown;
  dormant_clients_count: number;
  [key: string]: unknown;
}

/** Owner-only: wraps v_center_week_kpi (revenue-derived numbers). */
export const getCenterKpi = defineTool<Record<string, never>>({
  name: "get_center_kpi",
  description:
    "Restituisce i KPI settimanali del centro: scontrino medio, incasso, ore vendute vs ore di apertura, " +
    "occupazione, clienti attivi (30 giorni), clienti dormienti (nessuna visita da 60 giorni, con elenco), " +
    "ripresa in cassa (% di appuntamenti con riprenotazione) e incasso del mese. " +
    "Usalo per ogni domanda su come sta andando il centro. Non inventare mai questi numeri.",
  parameters: { type: "object", properties: {}, additionalProperties: false },
  access: "owner",
  write: false,
  async handler({ supabase, centerId }) {
    const row = unwrap<KpiRow>(
      await supabase.from("v_center_week_kpi").select("*").eq("center_id", centerId).maybeSingle(),
    );
    if (!row) throw new ToolError("not_found", "Nessun dato KPI disponibile per questo centro");

    const { center_id: _centerId, dormant_clients, ...kpi } = row;
    const dormant = Array.isArray(dormant_clients) ? dormant_clients : [];
    return {
      ...kpi,
      dormant_clients: dormant.slice(0, MAX_DORMANT),
      dormant_clients_truncated: dormant.length > MAX_DORMANT,
    };
  },
});
