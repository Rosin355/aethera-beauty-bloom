import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResendAccessRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { email }: ResendAccessRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Looking for email:', email);

    // Check if email exists in mailing_list
    const { data: mailingData, error: mailingError } = await supabase
      .from('mailing_list')
      .select('*')
      .eq('email', email.trim())
      .single();

    if (mailingError || !mailingData) {
      console.log('Email not found in mailing list:', mailingError);
      return new Response(
        JSON.stringify({ error: 'Email not found in our records' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Found mailing list entry:', mailingData);

    const accessUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://4elementiitalia.it'}/welcome?token=${mailingData.access_token}`;

    // Send email with Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email send');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Access link resend skipped - API key not configured',
        debug_access_url: accessUrl 
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
          from: '4 Elementi Italia <accesso@4elementiitalia.it>',
          to: [email],
          subject: 'Il tuo link di accesso a 4 Elementi Italia 🔑',
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1B1B1B, #2D2D2D); color: white; border-radius: 12px; overflow: hidden;">
              <div style="padding: 40px 30px; text-align: center;">
                <h1 style="color: #6AA8B3; font-size: 28px; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
                  Ecco il tuo link di accesso! 🔑
                </h1>
                <p style="font-size: 18px; margin-bottom: 30px; color: #F6F4ED;">
                  Ciao ${mailingData.name || 'bellezza'}! Hai richiesto il link per accedere ai contenuti esclusivi.
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
                    🎬 Accedi Ora al Contenuto
                  </a>
                </div>
                <p style="margin-top: 30px; color: #CBD8D4;">
                  Questo link ti darà accesso al video esclusivo sulla strategia dei prezzi e alla community riservata.
                </p>
                <p style="margin-top: 20px; color: #C2977E; font-style: italic; font-size: 14px;">
                  Conserva questa email per accedere quando vuoi.
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
        console.error('Error sending access link email:', errorData);
        throw new Error(`Failed to send access link email: ${errorData}`);
      }

      const responseData = await emailResponse.json();
      console.log('Access link email sent successfully:', responseData);

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Access link sent successfully',
        email_id: responseData.id,
        access_url: accessUrl 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (emailError: any) {
      console.error('Error sending access link email:', emailError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to send access link email: ${emailError.message}`,
        debug_access_url: accessUrl 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in resend-access-link function:', error);
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