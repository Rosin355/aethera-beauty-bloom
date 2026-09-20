import { clip, localDate, localTime, unwrap } from "./db.ts";
import { defineTool, ToolError } from "./types.ts";

const MAX_APPOINTMENTS = 40;
const MAX_GAPS = 20;

interface AppointmentRow {
  id: string;
  client_name: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  cabin: number | null;
  status: string;
  price: number | null;
  notes: string | null;
}

interface GapRow {
  cabin: number;
  gap_start: string;
  gap_end: string;
  minutes: number;
}

/** Any member: the agenda of one local day plus its free slots per cabin. */
export const listAppointments = defineTool<{ day?: string }>({
  name: "list_appointments",
  description:
    "Elenca gli appuntamenti di un giorno (default: oggi) con gli slot liberi per cabina. " +
    "Usalo per domande sull'agenda, sui buchi e sulla disponibilità. I prezzi compaiono solo per la titolare.",
  parameters: {
    type: "object",
    properties: {
      day: { type: "string", format: "date", description: "Giorno YYYY-MM-DD nel fuso del centro. Se omesso: oggi." },
    },
    additionalProperties: false,
  },
  access: "member",
  write: false,
  async handler({ supabase, centerId, args, now }) {
    const center = unwrap<{ timezone: string }>(
      await supabase.from("centers").select("timezone").eq("id", centerId).maybeSingle(),
    );
    if (!center) throw new ToolError("not_found", "Centro non trovato");

    const day = args.day ?? localDate(now, center.timezone);

    const [appointmentsRes, gapsRes] = await Promise.all([
      supabase.rpc("fn_center_appointments", { _center_id: centerId, _day: day }),
      supabase.rpc("fn_center_gaps", { _center_id: centerId, _day: day }),
    ]);
    const appointments = unwrap<AppointmentRow[]>(appointmentsRes) ?? [];
    const gaps = unwrap<GapRow[]>(gapsRes) ?? [];

    const tz = center.timezone;
    return {
      day,
      timezone: tz,
      appointments_total: appointments.length,
      appointments: appointments.slice(0, MAX_APPOINTMENTS).map((a) => ({
        id: a.id,
        client_name: a.client_name,
        service_name: a.service_name,
        start: localTime(a.starts_at, tz),
        end: localTime(a.ends_at, tz),
        starts_at: a.starts_at,
        duration_minutes: a.duration_minutes,
        cabin: a.cabin,
        status: a.status,
        ...(a.price !== null && a.price !== undefined ? { price: a.price } : {}),
        notes: clip(a.notes, 160),
      })),
      free_slots: gaps.slice(0, MAX_GAPS).map((g) => ({
        cabin: g.cabin,
        start: localTime(g.gap_start, tz),
        end: localTime(g.gap_end, tz),
        gap_start: g.gap_start,
        gap_end: g.gap_end,
        minutes: g.minutes,
      })),
      free_slots_truncated: gaps.length > MAX_GAPS,
    };
  },
});
