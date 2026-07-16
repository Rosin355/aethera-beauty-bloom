import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createServiceClient, HttpError, requireAuthenticatedUser, toErrorResponse } from "../_shared/auth.ts";
import { emailIsValid, readJsonBody } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  center_id?: string;
  email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticated only (verify_jwt=true). Not a public endpoint.
    const { user } = await requireAuthenticatedUser(req);
    const body = await readJsonBody<InviteRequest>(req);

    const centerId = typeof body.center_id === "string" ? body.center_id : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!centerId || !emailIsValid(email)) {
      throw new HttpError(400, "Dati invito non validi");
    }

    const service = createServiceClient();

    // Only the center owner may send invites.
    const { data: center } = await service
      .from("centers")
      .select("id, name, owner_user_id")
      .eq("id", centerId)
      .maybeSingle();

    if (!center || center.owner_user_id !== user.id) {
      throw new HttpError(403, "Solo il proprietario del centro può invitare");
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new HttpError(503, "Servizio email non configurato");
    }

    const baseUrl =
      (Deno.env.get("SUPABASE_URL") ?? "").replace(".supabase.co", ".lovable.app") ||
      "https://4elementiitalia.it";
    const signupUrl = `${baseUrl}/signup`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "4 Elementi Italia <accesso@4elementiitalia.it>",
        to: [email],
        subject: `Invito a collaborare su ${center.name} 🌿`,
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1B1B1B, #2D2D2D); color: white; border-radius: 12px; overflow: hidden;">
            <div style="padding: 40px 30px; text-align: center;">
              <h1 style="color: #6AA8B3; font-size: 26px; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
                Sei stata invitata! 🌿
              </h1>
              <p style="font-size: 17px; margin-bottom: 24px; color: #F6F4ED;">
                Il centro <strong>${center.name}</strong> ti ha invitata a collaborare sulla piattaforma 4 Elementi Italia.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${signupUrl}" style="background: linear-gradient(135deg, #6AA8B3, #E46A39); color: white; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Crea il tuo accesso
                </a>
              </div>
              <p style="color: #CBD8D4; font-size: 14px;">
                Registrati con questo indirizzo email (${email}) e troverai il centro già collegato al tuo account.
              </p>
            </div>
            <div style="background: #1B1B1B; padding: 20px; text-align: center;">
              <p style="color: #888; font-size: 12px; margin: 0;">© 2026 4 Elementi Italia. Tutti i diritti riservati.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Center invite email failed:", await response.text());
      throw new HttpError(502, "Invio invito non riuscito");
    }

    const data = await response.json();
    return new Response(JSON.stringify({ success: true, email_id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return toErrorResponse(error, corsHeaders);
  }
};

serve(handler);
