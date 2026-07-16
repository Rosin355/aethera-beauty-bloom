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

interface ResendAccessRequest {
  email?: string;
}

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const body = await readJsonBody<ResendAccessRequest & Record<string, unknown>>(req);

    // Bots that fill the hidden honeypot field: accept silently, do nothing.
    if (isHoneypotTripped(body)) {
      return json({ success: true, message: "Se l'email è registrata, riceverai il link di accesso." }, 200);
    }

    await enforceRateLimit(supabase, `resend-access-link:${getClientIp(req)}`, 5, 600);

    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!emailIsValid(email)) {
      throw new HttpError(400, "Email non valida");
    }

    const { data: mailingData, error } = await supabase
      .from("mailing_list")
      .select("name, access_token")
      .eq("email", email)
      .single();

    if (error || !mailingData?.access_token) {
      // Message kept in English so the recovery page's not-found detection keeps working.
      throw new HttpError(404, "Email not found in our records");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      // Never report success when nothing was actually sent.
      throw new HttpError(503, "Servizio email non configurato");
    }

    const baseUrl =
      (Deno.env.get("SUPABASE_URL") ?? "").replace(".supabase.co", ".lovable.app") ||
      "https://4elementiitalia.it";
    const accessUrl = `${baseUrl}/welcome?token=${mailingData.access_token}`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "4 Elementi Italia <accesso@4elementiitalia.it>",
        to: [email],
        subject: "Il tuo link di accesso a 4 Elementi Italia 🔑",
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1B1B1B, #2D2D2D); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 40px 30px; text-align: center;">
              <h1 style="color: #6AA8B3; font-size: 28px; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
                Ecco il tuo link di accesso! 🔑
              </h1>
              <p style="font-size: 18px; margin-bottom: 30px; color: #F6F4ED;">
                Ciao ${mailingData.name || "bellezza"}! Hai richiesto il link per accedere ai contenuti esclusivi.
              </p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${accessUrl}" style="background: linear-gradient(135deg, #6AA8B3, #E46A39); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                  🎬 Accedi Ora al Contenuto
                </a>
              </div>
              <p style="margin-top: 20px; color: #C2977E; font-style: italic; font-size: 14px;">
                Conserva questa email per accedere quando vuoi.
              </p>
            </div>
            <div style="background: #1B1B1B; padding: 20px; text-align: center;">
              <p style="color: #888; font-size: 12px; margin: 0;">
                © 2026 4 Elementi Italia. Tutti i diritti riservati.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Error sending access link email:", await emailResponse.text());
      throw new HttpError(502, "Invio del link di accesso non riuscito");
    }

    const responseData = await emailResponse.json();
    return json({ success: true, message: "Link di accesso inviato", email_id: responseData.id }, 200);
  } catch (error) {
    return toErrorResponse(error, corsHeaders);
  }
};

serve(handler);
