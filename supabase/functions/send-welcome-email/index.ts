import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  access_token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, access_token }: WelcomeEmailRequest = await req.json();

    if (!email || !access_token) {
      return new Response(
        JSON.stringify({ error: 'Email and access_token are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Sending welcome email to:', email);

    const accessUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://4elementiitalia.it'}/welcome?token=${access_token}`;

    // Send email with Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email send');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Welcome email send skipped - API key not configured',
        access_url: accessUrl 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
                  Benvenuto/a ${name || 'bellezza'}! 🎉
                </h1>
                <p style="font-size: 18px; margin-bottom: 30px; color: #F6F4ED;">
                  Grazie per esserti iscritto/a alla nostra community esclusiva!
                </p>
                <p style="margin-bottom: 30px; color: #CBD8D4;">
                  Abbiamo preparato per te un contenuto speciale che ti aiuterà a strutturare il tuo listino prezzi in modo strategico.
                </p>
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${accessUrl}" 
                     style="background: linear-gradient(135deg, #6AA8B3, #E46A39); 
                            color: white; 
                            padding: 18px 40px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: bold;
                            font-size: 16px;
                            display: inline-block;">
                    🎬 Guarda il Video Esclusivo
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
        throw new Error(`Failed to send welcome email: ${errorData}`);
      }

      const responseData = await emailResponse.json();
      console.log('Welcome email sent successfully:', responseData);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        email_id: responseData.id,
        access_url: accessUrl 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (emailError: any) {
      console.error('Error sending welcome email:', emailError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to send welcome email: ${emailError.message}`,
        access_url: accessUrl 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in send-welcome-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);