import { HttpError, type ServiceClient } from "./auth.ts";

/** Best-effort client IP from the proxy headers. */
export const getClientIp = (req: Request): string => {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RFC-ish email check with a hard length cap. */
export const emailIsValid = (email: unknown): email is string =>
  typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email.trim());

/**
 * Read and JSON-parse the request body with a hard byte cap, so a client cannot
 * push an oversized payload into the function.
 */
export const readJsonBody = async <T>(req: Request, maxBytes = 8 * 1024): Promise<T> => {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new HttpError(413, "Payload troppo grande");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Corpo della richiesta non valido");
  }
};

/**
 * A honeypot field a real user never fills (the form input is hidden). If present
 * and non-empty, the caller should accept the request silently and do nothing.
 */
export const isHoneypotTripped = (body: Record<string, unknown>): boolean => {
  const value = body?.company ?? body?.website ?? body?.hp;
  return typeof value === "string" && value.trim().length > 0;
};

/**
 * Windowed rate limit backed by the public.rate_limits table (service role only).
 * Throws HttpError 429 when the limit is exceeded. Fails open on infrastructure
 * errors so a transient DB issue never locks out legitimate users.
 */
export const enforceRateLimit = async (
  supabase: ServiceClient,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> => {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Opportunistic cleanup of this key's expired rows.
  await supabase.from("rate_limits").delete().eq("key", key).lt("created_at", since);

  const { count, error } = await supabase
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", since);

  if (error) {
    console.error("rate limit count failed:", error.message);
    return; // fail open
  }

  if ((count ?? 0) >= limit) {
    throw new HttpError(429, "Troppe richieste. Riprova tra qualche minuto.");
  }

  await supabase.from("rate_limits").insert({ key });
};
