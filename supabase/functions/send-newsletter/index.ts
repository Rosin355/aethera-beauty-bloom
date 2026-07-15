import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { HttpError, requireAdminUser, toErrorResponse } from "../_shared/auth.ts";
import { readJsonBody } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  subject?: string;
  content?: string;
}

const unsubscribeUrl = (token: string): string => {
  const base = Deno.env.get("SUPABASE_URL") ?? "";
  return `${base}/functions/v1/newsletter-unsubscribe?token=${token}`;
};

const renderEmail = (content: string, unsubUrl: string): string => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #1B1B1B, #2D2D2D); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0;">
      <h1 style="color: #6AA8B3; text-align: center; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
        4 Elementi Italia Newsletter
      </h1>
    </div>
    <div style="background: white; padding: 30px; color: #333; line-height: 1.6;">
      ${content}
    </div>
    <div style="background: #F6F4ED; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
      <p style="margin: 0; color: #666; font-size: 12px;">© 2026 4 Elementi Italia. Tutti i diritti riservati.</p>
      <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
        <a href="${unsubUrl}" style="color: #6AA8B3;">Annulla iscrizione</a>
      </p>
    </div>
  </div>`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticated AND admin. Non-admin JWT → 403.
    const { supabase } = await requireAdminUser(req);

    const { subject, content } = await readJsonBody<NewsletterRequest>(req, 256 * 1024);
    if (!subject?.trim() || !content?.trim()) {
      throw new HttpError(400, "Oggetto e contenuto sono obbligatori");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      // Never report success when nothing was actually sent.
      throw new HttpError(503, "Servizio email non configurato (RESEND_API_KEY mancante)");
    }

    // Only active (not unsubscribed) subscribers, each with its own token.
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscriptions")
      .select("email, unsubscribe_token")
      .is("unsubscribed_at", null);

    if (error) {
      throw new HttpError(500, "Impossibile recuperare gli iscritti");
    }

    const recipients = (subscribers ?? []).filter((s) => typeof s.email === "string" && s.email);
    if (recipients.length === 0) {
      throw new HttpError(400, "Nessun iscritto attivo");
    }

    let sent = 0;
    const failed: string[] = [];

    // ONE email per recipient — never a shared "to" that would expose addresses.
    for (const recipient of recipients) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "4 Elementi Italia <newsletter@4elementiitalia.it>",
            to: [recipient.email],
            subject,
            html: renderEmail(content, unsubscribeUrl(recipient.unsubscribe_token)),
          }),
        });

        if (response.ok) {
          sent += 1;
        } else {
          failed.push(recipient.email);
          console.error(`Newsletter send failed for a recipient: ${response.status}`);
        }
      } catch (sendError) {
        failed.push(recipient.email);
        console.error("Newsletter send threw for a recipient:", sendError);
      }

      // Gentle pacing to respect Resend rate limits.
      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    // If every send failed, surface it as an error rather than a hollow success.
    const status = sent === 0 ? 502 : 200;
    return new Response(
      JSON.stringify({ success: sent > 0, sent, failed: failed.length }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return toErrorResponse(error, corsHeaders);
  }
};

serve(handler);
