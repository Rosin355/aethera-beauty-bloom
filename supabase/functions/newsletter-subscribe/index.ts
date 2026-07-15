import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient, HttpError, toErrorResponse } from "../_shared/auth.ts";
import {
  emailIsValid,
  enforceRateLimit,
  getClientIp,
  isHoneypotTripped,
  readJsonBody,
} from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  email?: string;
  name?: string;
  mailing_list_id?: string;
}

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const unsubscribeUrl = (token: string): string =>
  `${Deno.env.get("SUPABASE_URL") ?? ""}/functions/v1/newsletter-unsubscribe?token=${token}`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const body = await readJsonBody<NewsletterRequest & Record<string, unknown>>(req);

    // Bots that fill the hidden honeypot field: accept silently, do nothing.
    if (isHoneypotTripped(body)) {
      return json({ success: true, message: "Iscrizione completata" }, 200);
    }

    await enforceRateLimit(supabase, `newsletter-subscribe:${getClientIp(req)}`, 5, 600);

    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!emailIsValid(email)) {
      throw new HttpError(400, "Email non valida");
    }
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : null;
    const mailingListId = typeof body.mailing_list_id === "string" ? body.mailing_list_id : null;

    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .insert([{ email, name, mailing_list_id: mailingListId }])
      .select("email, name, unsubscribe_token")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new HttpError(409, "Email già iscritta alla newsletter");
      }
      console.error("Database error:", error);
      throw new HttpError(500, "Errore durante l'iscrizione");
    }

    // Confirmation email is secondary: a send failure must NOT undo the (successful)
    // subscription, but we also never claim it was sent when it wasn't.
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "4 Elementi Italia <newsletter@4elementiitalia.it>",
            to: [data.email],
            subject: "Iscrizione Newsletter Confermata! 📧",
            html: `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1B1B1B, #2D2D2D); color: white; border-radius: 12px; overflow: hidden;">
                <div style="padding: 40px 30px; text-align: center;">
                  <h1 style="color: #6AA8B3; font-size: 28px; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
                    Iscrizione Confermata! 📧
                  </h1>
                  <p style="font-size: 18px; margin-bottom: 30px; color: #F6F4ED;">
                    Ciao ${data.name || "bellezza"}! La tua iscrizione alla newsletter è stata confermata.
                  </p>
                  <p style="margin-bottom: 30px; color: #CBD8D4;">
                    Riceverai i nostri contenuti esclusivi, tips e aggiornamenti direttamente nella tua casella email.
                  </p>
                </div>
                <div style="background: #1B1B1B; padding: 20px; text-align: center;">
                  <p style="color: #888; font-size: 12px; margin: 0;">
                    © 2026 4 Elementi Italia. Tutti i diritti riservati.<br>
                    <a href="${unsubscribeUrl(data.unsubscribe_token)}" style="color: #6AA8B3;">Annulla iscrizione</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          console.error("Error sending newsletter confirmation:", await emailResponse.text());
        }
      } catch (sendError) {
        console.error("Error sending newsletter confirmation:", sendError);
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping newsletter confirmation");
    }

    return json({ success: true, message: "Iscrizione alla newsletter completata con successo" }, 200);
  } catch (error) {
    return toErrorResponse(error, corsHeaders);
  }
};

serve(handler);
