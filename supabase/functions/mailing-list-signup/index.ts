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

interface MailingListRequest {
  name?: string;
  email?: string;
  source?: string;
}

interface EmailSendResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const hasErrorCode = (value: unknown): value is { code: string } =>
  typeof value === "object" && value !== null && "code" in value &&
  typeof (value as { code?: unknown }).code === "string";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const body = await readJsonBody<MailingListRequest & Record<string, unknown>>(req);

    // Bots that fill the hidden honeypot field: accept silently, do nothing.
    if (isHoneypotTripped(body)) {
      return json({ success: true, message: "Registrazione completata" }, 200);
    }

    await enforceRateLimit(supabase, `mailing-list-signup:${getClientIp(req)}`, 5, 600);

    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const source = typeof body.source === "string" ? body.source.slice(0, 100) : "landing_page";

    if (!name || !emailIsValid(email)) {
      throw new HttpError(400, "Nome ed email validi sono obbligatori");
    }

    const { data, error } = await supabase
      .from("mailing_list")
      .insert([{ name, email, source }])
      .select("access_token, unsubscribe_token")
      .single();

    if (error) {
      if (hasErrorCode(error) && error.code === "23505") {
        // Already registered: recover the existing tokens and resend the welcome email.
        const { data: existing, error: fetchErr } = await supabase
          .from("mailing_list")
          .select("access_token, unsubscribe_token")
          .eq("email", email)
          .single();

        if (fetchErr || !existing?.access_token) {
          throw new HttpError(409, "Email già registrata ma token non trovato");
        }

        const emailResult = await sendWelcomeEmail(
          email,
          name,
          existing.access_token,
          existing.unsubscribe_token,
        );

        return json({
          success: true,
          access_token: existing.access_token,
          message: "Email già registrata",
          email_sent: emailResult.success,
          email_status: emailResult.success ? "inviata" : "errore invio",
        }, 200);
      }

      console.error("Database error:", error);
      throw new HttpError(500, "Errore durante la registrazione");
    }

    const emailResult = await sendWelcomeEmail(email, name, data.access_token, data.unsubscribe_token);

    return json({
      success: true,
      access_token: data.access_token,
      message: "Registrazione completata con successo",
      email_sent: emailResult.success,
      email_status: emailResult.success ? "inviata" : "errore invio",
    }, 200);
  } catch (error) {
    return toErrorResponse(error, corsHeaders);
  }
};

const buildWelcomeHtml = (name: string, accessUrl: string, unsubUrl: string): string => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1B1B1B, #2D2D2D); color: white; border-radius: 12px; overflow: hidden;">
    <div style="padding: 40px 30px; text-align: center;">
      <h1 style="color: #6AA8B3; font-size: 28px; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
        Benvenuto/a ${name}! 🎉
      </h1>
      <p style="font-size: 18px; margin-bottom: 30px; color: #F6F4ED;">
        Grazie per esserti iscritto/a alla nostra community esclusiva!
      </p>
      <div style="text-align: center; margin: 40px 0;">
        <a href="${accessUrl}" style="background: linear-gradient(135deg, #6AA8B3, #E46A39); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
          🎬 Accedi al Contenuto Esclusivo
        </a>
      </div>
      <p style="margin-top: 30px; color: #C2977E; font-style: italic;">
        Conserva questa email, contiene il tuo link di accesso personale.
      </p>
    </div>
    <div style="background: #1B1B1B; padding: 20px; text-align: center;">
      <p style="color: #888; font-size: 12px; margin: 0;">
        © 2026 4 Elementi Italia. Tutti i diritti riservati.<br>
        <a href="${unsubUrl}" style="color: #6AA8B3;">Annulla iscrizione</a>
      </p>
    </div>
  </div>`;

async function sendWelcomeEmail(
  email: string,
  name: string,
  accessToken: string,
  unsubscribeToken: string,
): Promise<EmailSendResult> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.log("RESEND_API_KEY non configurata, salto invio email");
    return { success: false, error: "API key mancante" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const baseUrl = supabaseUrl.replace(".supabase.co", ".lovable.app") || "https://4elementiitalia.it";
  const accessUrl = `${baseUrl}/welcome?token=${accessToken}`;
  const unsubUrl = `${supabaseUrl}/functions/v1/newsletter-unsubscribe?token=${unsubscribeToken}`;
  const emailHtml = buildWelcomeHtml(name, accessUrl, unsubUrl);

  const senders = [
    "4 Elementi Italia <benvenuto@4elementiitalia.it>",
    "4 Elementi Italia <onboarding@resend.dev>",
  ];

  for (const from of senders) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Benvenuto/a in 4 Elementi Italia! 🎉",
          html: emailHtml,
        }),
      });

      const responseText = await response.text();
      if (response.ok) {
        const emailData = JSON.parse(responseText);
        return { success: true, emailId: emailData.id };
      }
      console.error(`Welcome email send failed (${from}): ${response.status}`);
    } catch (sendError) {
      console.error(`Welcome email send threw (${from}):`, sendError);
    }
  }

  return { success: false, error: "Invio email fallito su tutti i mittenti" };
}

serve(handler);
