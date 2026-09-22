import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

export type ServiceClient = SupabaseClient;

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const createServiceClient = (): ServiceClient => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new HttpError(500, "Configurazione Supabase non valida");
  }

  return createClient(supabaseUrl, serviceRoleKey);
};

/**
 * Client bound to the CALLER's identity (anon key + the caller's JWT). Unlike the service client,
 * every query goes through RLS and auth.uid() is set inside RPCs, so center-scoped code that uses
 * it cannot read or write outside the caller's centers. Prefer this for anything tenant-scoped.
 */
export type UserClient = ServiceClient;

export const createUserClient = (token: string): UserClient => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    throw new HttpError(500, "Configurazione Supabase non valida");
  }

  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

export const getBearerToken = (req: Request): string => {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader) {
    throw new HttpError(401, "Autenticazione richiesta");
  }

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    throw new HttpError(401, "Header Authorization non valido");
  }

  return token;
};

export const requireAuthenticatedUser = async (
  req: Request,
): Promise<{ supabase: ServiceClient; user: User }> => {
  const token = getBearerToken(req);
  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    throw new HttpError(401, "Token non valido o scaduto");
  }

  return { supabase, user: data.user };
};

export const isAdminUser = async (
  supabase: ServiceClient,
  userId: string,
): Promise<boolean> => {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (error) {
    throw new HttpError(500, "Errore verifica permessi");
  }

  return Boolean(data);
};

export const requireAdminUser = async (
  req: Request,
): Promise<{ supabase: ServiceClient; user: User }> => {
  const { supabase, user } = await requireAuthenticatedUser(req);
  const isAdmin = await isAdminUser(supabase, user.id);

  if (!isAdmin) {
    throw new HttpError(403, "Permessi insufficienti");
  }

  return { supabase, user };
};

/**
 * Every edge function funnels its catch-all through this. An `HttpError` was deliberately thrown
 * by the app's own code with a message that's already safe to show the caller (Italian, no
 * internals). Anything else -- a driver error, a network failure, an unexpected TypeError -- is
 * logged in full server-side but answered with a generic message only, so a raw exception text
 * (which can include SQL, hostnames, or other internal detail) never reaches the HTTP response.
 */
export const toErrorResponse = (
  error: unknown,
  corsHeaders: Record<string, string>,
): Response => {
  const status = error instanceof HttpError ? error.status : 500;
  if (!(error instanceof HttpError)) {
    console.error("unhandled error:", error);
  }
  const message = error instanceof HttpError ? error.message : "Errore interno";

  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};
