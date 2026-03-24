import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  email: string;
  name?: string;
  mailing_list_id?: string;
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

    const { email, name, mailing_list_id }: NewsletterRequest = await req.json();

    // Validation
    if (!email?.trim()) {
      return new Response(
        JSON.stringify({ error: "Email è obbligatoria" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Insert into newsletter_subscriptions
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .insert([{
        email: email.trim(),
        name: name?.trim() || null,
        mailing_list_id: mailing_list_id || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ error: "Email già iscritta alla newsletter" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Errore durante l'iscrizione" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Newsletter subscription successful:", { email, name });

    // Send newsletter confirmation email
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
            from: '4 Elementi Italia <newsletter@4elementiitalia.it>',
            to: [email],
            subject: 'Iscrizione Newsletter Confermata! 📧',
            html: `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1B1B1B, #2D2D2D); color: white; border-radius: 12px; overflow: hidden;">
                <div style="padding: 40px 30px; text-align: center;">
                  <h1 style="color: #6AA8B3; font-size: 28px; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
                    Iscrizione Confermata! 📧
                  </h1>
                  <p style="font-size: 18px; margin-bottom: 30px; color: #F6F4ED;">
                    Ciao ${name || 'bellezza'}! La tua iscrizione alla newsletter è stata confermata.
                  </p>
                  <p style="margin-bottom: 30px; color: #CBD8D4;">
                    Riceverai i nostri contenuti esclusivi, tips e aggiornamenti direttamente nella tua casella email.
                  </p>
                  <div style="background: rgba(106, 168, 179, 0.1); padding: 20px; border-radius: 8px; margin: 30px 0;">
                    <h3 style="color: #6AA8B3; margin-bottom: 15px;">Cosa riceverai:</h3>
                    <ul style="text-align: left; color: #CBD8D4; line-height: 1.6;">
                      <li>✅ Tips esclusivi per il business della bellezza</li>
                      <li>✅ Strategie di pricing e marketing</li>
                      <li>✅ Novità e contenuti in anteprima</li>
                      <li>✅ Inviti a eventi speciali</li>
                    </ul>
                  </div>
                  <p style="margin-top: 30px; color: #C2977E; font-style: italic;">
                    Ti arriverà presto la prima newsletter!
                  </p>
                </div>
                <div style="background: #1B1B1B; padding: 20px; text-align: center;">
                  <p style="color: #888; font-size: 12px; margin: 0;">
                    © 2024 4 Elementi Italia. Tutti i diritti riservati.<br>
                    <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://4elementiitalia.it'}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #6AA8B3;">Annulla iscrizione</a>
                  </p>
                </div>
              </div>
            `
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.text();
          console.error('Error sending newsletter confirmation:', errorData);
        } else {
          console.log('Newsletter confirmation sent successfully to:', email);
        }
      } catch (error) {
        console.error('Error sending newsletter confirmation:', error);
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping newsletter confirmation');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Iscrizione alla newsletter completata con successo"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    console.error("Error in newsletter-subscribe function:", error);
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
