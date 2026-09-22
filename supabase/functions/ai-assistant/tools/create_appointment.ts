import { unwrap } from "./db.ts";
import { defineTool, ToolError } from "./types.ts";

interface CreateAppointmentArgs {
  client_name: string;
  service_id: string;
  starts_at: string;
  cabin?: number;
  notes?: string;
  confirmed: boolean;
}

/**
 * Write tool (P1.4). confirmed:false (or omitted) never writes: it returns a preview to show
 * the user first. confirmed:true re-runs the same conflict check before writing, so a stale
 * preview can never silently land in a slot that filled up meanwhile. On conflict, returns the
 * 2 nearest free alternatives instead of writing, regardless of `confirmed`.
 */
export const createAppointment = defineTool<CreateAppointmentArgs>({
  name: "create_appointment",
  description:
    "Prenota un nuovo appuntamento in agenda. Prima chiamata (confirmed:false o omesso): mostra " +
    "un'anteprima all'utente, senza scrivere nulla. Richiama con confirmed:true SOLO dopo un sì " +
    "esplicito dell'utente nel messaggio più recente. Se lo slot è occupato, restituisce le 2 " +
    "alternative libere più vicine invece di scrivere.",
  parameters: {
    type: "object",
    properties: {
      client_name: { type: "string", minLength: 1, maxLength: 120 },
      service_id: {
        type: "string",
        format: "uuid",
        description: "Id del servizio dal catalogo del centro (da get_center_profile).",
      },
      starts_at: {
        type: "string",
        format: "date-time",
        description: "Inizio dell'appuntamento, ISO 8601 con offset (fuso del centro).",
      },
      cabin: {
        type: "integer",
        minimum: 1,
        maximum: 20,
        description: "Cabina richiesta; se omessa, ne sceglie una libera in automatico.",
      },
      notes: { type: "string", maxLength: 500 },
      confirmed: { type: "boolean", description: "true solo dopo la conferma esplicita dell'utente." },
    },
    required: ["client_name", "service_id", "starts_at", "confirmed"],
    additionalProperties: false,
  },
  access: "member",
  write: true,
  async handler({ supabase, centerId, args }) {
    const result = unwrap<Record<string, unknown>>(
      await supabase.rpc("fn_create_appointment", {
        _center_id: centerId,
        _client_name: args.client_name,
        _service_id: args.service_id,
        _starts_at: args.starts_at,
        _cabin: args.cabin ?? null,
        _notes: args.notes ?? null,
        _confirmed: args.confirmed === true,
      }),
    );
    if (!result) throw new ToolError("internal", "Nessun risultato dallo strumento");
    return result;
  },
});
