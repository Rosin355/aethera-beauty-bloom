import { ToolError } from "./types.ts";

interface DbResult<T> {
  data: T | null;
  error: { code?: string; message?: string } | null;
}

/**
 * Turn a supabase-js result into data or a ToolError. Only the errors that WE raise on purpose
 * (42501 access denied, 22023 invalid argument) keep their message; everything else becomes a
 * generic `internal` so SQL details never reach the model or the client.
 */
export const unwrap = <T>(result: DbResult<T>): T | null => {
  const { data, error } = result;
  if (!error) return data;
  if (error.code === "42501") throw new ToolError("forbidden", "Accesso negato al centro");
  if (error.code === "22023") throw new ToolError("invalid_args", error.message ?? "Argomento non valido");
  console.error("db error code:", error.code ?? "unknown");
  throw new ToolError("internal", "Errore di lettura dati");
};

/** YYYY-MM-DD of `now` in the given IANA time zone. */
export const localDate = (now: Date, timeZone: string): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

/** HH:MM of an ISO instant in the given IANA time zone. */
export const localTime = (iso: string, timeZone: string): string =>
  new Intl.DateTimeFormat("it-IT", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));

export const clip = (text: string | null | undefined, max: number): string | null =>
  text == null ? null : text.length > max ? `${text.slice(0, max)}…` : text;
