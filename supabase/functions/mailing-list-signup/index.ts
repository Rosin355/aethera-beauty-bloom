import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MailingListRequest {
  name: string;
  email: string;
  source?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { name, email, source = "landing_page" }: MailingListRequest = await req.json();

    // Validation
    if (!name?.trim() || !email?.trim()) {
      return new Response(
        JSON.stringify({ error: "Nome e email sono obbligatori" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Insert into mailing_list
    const { data, error } = await supabase
      .from('mailing_list')
      .insert([{
        name: name.trim(),
        email: email.trim(),
        source: source
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      
      if ((error as any).code === '23505') {
        // Email già presente: recupero access_token esistente e ritorno 200
        const { data: existing, error: fetchErr } = await supabase
          .from('mailing_list')
          .select('access_token')
          .eq('email', email.trim())
          .single();

        if (fetchErr || !existing?.access_token) {
          console.error('Errore recupero access_token esistente:', fetchErr);
          return new Response(
            JSON.stringify({ error: "Email già registrata ma token non trovato" }),
            {
              status: 409,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        console.log('Email già registrata, token recuperato e restituito');
        return new Response(
          JSON.stringify({ success: true, access_token: existing.access_token, message: 'Email già registrata' }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Errore durante la registrazione" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Mailing list signup successful:", { email, name, source });

    // Send welcome email with Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '4 Elementi Italia <benvenuto@4elementiitalia.it>',
            to: [email],
            subject: 'Benvenuto/a in 4 Elementi Italia! 🎉',
            html: `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1B1B1B, #2D2D2D); color: white; border-radius: 12px; overflow: hidden;">
                <div style="padding: 40px 30px; text-align: center;">
                  <h1 style="color: #6AA8B3; font-size: 28px; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
                    Benvenuto/a ${name}! 🎉
                  </h1>
                  <p style="font-size: 18px; margin-bottom: 30px; color: #F6F4ED;">
                    Grazie per esserti iscritto/a alla nostra community esclusiva!
                  </p>
                  <p style="margin-bottom: 30px; color: #CBD8D4;">
                    Abbiamo preparato per te un contenuto speciale che ti aiuterà a strutturare il tuo listino prezzi in modo strategico.
                  </p>
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://4elementiitalia.it'}/welcome?token=${data.access_token}" 
                       style="background: linear-gradient(135deg, #6AA8B3, #E46A39); 
                              color: white; 
                              padding: 18px 40px; 
                              text-decoration: none; 
                              border-radius: 8px; 
                              font-weight: bold;
                              font-size: 16px;
                              display: inline-block;">
                      🎬 Accedi al Contenuto Esclusivo
                    </a>
                  </div>
                  <div style="background: rgba(106, 168, 179, 0.1); padding: 20px; border-radius: 8px; margin: 30px 0;">
                    <h3 style="color: #6AA8B3; margin-bottom: 15px;">Cosa troverai:</h3>
                    <ul style="text-align: left; color: #CBD8D4; line-height: 1.6;">
                      <li>✅ Video completo sulla strategia dei prezzi</li>
                      <li>✅ Tips esclusivi per il tuo business</li>
                      <li>✅ Accesso alla community riservata</li>
                    </ul>
                  </div>
                  <p style="margin-top: 30px; color: #C2977E; font-style: italic;">
                    Conserva questa email, contiene il tuo link di accesso personale.
                  </p>
                </div>
                <div style="background: #1B1B1B; padding: 20px; text-align: center;">
                  <p style="color: #888; font-size: 12px; margin: 0;">
                    © 2024 4 Elementi Italia. Tutti i diritti riservati.
                  </p>
                </div>
              </div>
            `
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error('Error sending welcome email:', errorData);
        } else {
          console.log('Welcome email sent successfully to:', email);
        }
      } catch (error) {
        console.error('Error sending welcome email:', error);
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping welcome email');
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_token: data.access_token,
        message: "Registrazione completata con successo"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in mailing-list-signup function:", error);
    return new Response(
      JSON.stringify({ error: "Errore interno del server" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);