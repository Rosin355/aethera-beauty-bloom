import { localDayTime, unwrap } from "./db.ts";
import { defineTool, ToolError } from "./types.ts";

interface MoveAppointmentArgs {
  id: string;
  new_starts_at: string;
  confirmed: boolean;
}

interface AppointmentSnapshot {
  client_name: string;
  service_name: string;
}

/**
 * Write tool (P1.4). Same shape as create_appointment: confirmed:false previews (and drafts the
 * client message), confirmed:true re-checks and, if still clear, moves it. Same cabin, new time
 * only. On conflict, returns the 2 nearest free alternatives instead of writing.
 */
export const moveAppointment = defineTool<MoveAppointmentArgs>({
  name: "move_appointment",
  description:
    "Sposta un appuntamento esistente a un nuovo orario, stessa cabina. Prima chiamata " +
    "(confirmed:false o omesso): restituisce un'anteprima e il messaggio da mostrare alla " +
    "cliente, senza scrivere nulla. Richiama con confirmed:true SOLO dopo un sì esplicito " +
    "dell'utente nel messaggio più recente. Se il nuovo orario è occupato, restituisce le 2 " +
    "alternative libere più vicine invece di scrivere.",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid", description: "Id dell'appuntamento (da list_appointments)." },
      new_starts_at: {
        type: "string",
        format: "date-time",
        description: "Nuovo inizio, ISO 8601 con offset (fuso del centro).",
      },
      confirmed: { type: "boolean", description: "true solo dopo la conferma esplicita dell'utente." },
    },
    required: ["id", "new_starts_at", "confirmed"],
    additionalProperties: false,
  },
  access: "member",
  write: true,
  async handler({ supabase, centerId, args }) {
    const result = unwrap<Record<string, unknown>>(
      await supabase.rpc("fn_move_appointment", {
        _center_id: centerId,
        _appointment_id: args.id,
        _new_starts_at: args.new_starts_at,
        _confirmed: args.confirmed === true,
      }),
    );
    if (!result) throw new ToolError("internal", "Nessun risultato dallo strumento");
    if (result.status !== "draft" && result.status !== "moved") return result;

    const center = unwrap<{ timezone: string }>(
      await supabase.from("centers").select("timezone").eq("id", centerId).maybeSingle(),
    );
    const tz = center?.timezone || "Europe/Rome";
    const isDraft = result.status === "draft";
    const snapshot = (isDraft ? result.preview : result.appointment) as
      & AppointmentSnapshot
      & { new_starts_at?: string; starts_at?: string };
    const when = localDayTime(String(snapshot.new_starts_at ?? snapshot.starts_at), tz);

    return {
      ...result,
      draft_message: isDraft
        ? `Ciao ${snapshot.client_name}, possiamo spostare il tuo appuntamento (${snapshot.service_name}) a ` +
          `${when}? Fammi sapere se per te va bene.`
        : `Ciao ${snapshot.client_name}, ti confermo che ho spostato il tuo appuntamento ` +
          `(${snapshot.service_name}) a ${when}. A presto!`,
    };
  },
});
