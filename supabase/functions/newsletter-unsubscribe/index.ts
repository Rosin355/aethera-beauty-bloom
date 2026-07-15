import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient, HttpError, toErrorResponse } from "../_shared/auth.ts";
import { enforceRateLimit, getClientIp } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const page = (title: string, message: string): string => `<!doctype html>
<html lang="it"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} — 4 Elementi Italia</title></head>
<body style="margin:0;background:#050505;color:#fff;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:520px;margin:12vh auto;padding:40px 32px;text-align:center;
              background:#0a0a0a;border:1px solid rgba(255,255,255,.1);border-radius:24px;">
    <p style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#bfeeff;margin:0 0 16px;">
      4 Elementi Italia
    </p>
    <h1 style="font-size:24px;margin:0 0 12px;">${title}</h1>
    <p style="color:rgba(255,255,255,.62);line-height:1.6;margin:0;">${message}</p>
  </div>
</body></html>`;

const html = (body: string, status = 200): Response =>
  new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    await enforceRateLimit(supabase, `unsubscribe:${getClientIp(req)}`, 20, 600);

    const token = new URL(req.url).searchParams.get("token")?.trim() ?? "";
    if (!UUID_RE.test(token)) {
      return html(
        page("Link non valido", "Il link di annullamento iscrizione non è valido o è incompleto."),
        400,
      );
    }

    // Tokens are globally-unique UUIDs, so at most one table matches.
    for (const table of ["newsletter_subscriptions", "mailing_list"] as const) {
      const { data, error } = await supabase
        .from(table)
        .select("id, unsubscribed_at")
        .eq("unsubscribe_token", token)
        .maybeSingle();

      if (error) throw new HttpError(500, "Errore durante l'annullamento");
      if (!data) continue;

      // Idempotent: only write if not already unsubscribed.
      if (!data.unsubscribed_at) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq("id", data.id);
        if (updateError) throw new HttpError(500, "Errore durante l'annullamento");
      }

      return html(
        page(
          "Iscrizione annullata",
          "Non riceverai più le nostre email. Puoi iscriverti di nuovo quando vuoi dal nostro sito.",
        ),
      );
    }

    return html(
      page("Link non valido", "Questo link di annullamento iscrizione non è più valido."),
      404,
    );
  } catch (error) {
    return toErrorResponse(error, corsHeaders);
  }
});
