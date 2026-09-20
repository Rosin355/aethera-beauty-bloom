import { unwrap } from "./db.ts";
import { defineTool, ToolError } from "./types.ts";

interface SimulationRow {
  [key: string]: unknown;
}

/** Owner-only: wraps fn_simulate_goal (monthly revenue goal → clients / hours needed). */
export const simulateGoal = defineTool<{ goal_amount: number }>({
  name: "simulate_goal",
  description:
    "Simula un obiettivo di incasso mensile in euro: quanti clienti (visite) e quante ore di cabina servono " +
    "ancora per raggiungerlo, in base allo scontrino medio reale, e a che punto è il mese. " +
    "Se i dati non bastano, i campi restano null: dillo, non stimare tu.",
  parameters: {
    type: "object",
    properties: {
      goal_amount: {
        type: "number",
        description: "Obiettivo di incasso del mese corrente, in euro (es. 12000)",
        minimum: 1,
        maximum: 10_000_000,
      },
    },
    required: ["goal_amount"],
    additionalProperties: false,
  },
  access: "owner",
  write: false,
  async handler({ supabase, centerId, args }) {
    const rows = unwrap<SimulationRow[]>(
      await supabase.rpc("fn_simulate_goal", { _center_id: centerId, _goal_amount: args.goal_amount }),
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) throw new ToolError("not_found", "Simulazione non disponibile");
    return row;
  },
});
