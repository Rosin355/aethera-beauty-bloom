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

    // TODO: Send email with Resend when API key is configured
    // For now, we'll just return success
    const accessUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'http://localhost:5173'}/welcome?token=${mailingData.access_token}`;
    
    console.log('Access URL would be:', accessUrl);

    // TODO: Uncomment and configure when RESEND_API_KEY is available
    /*
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email send');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email send skipped - API key not configured',
        access_url: accessUrl 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '4 Elementi Italia <noreply@4elementi.it>',
        to: [email],
        subject: 'Il tuo link di accesso - 4 Elementi Italia',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1B1B1B;">Accedi alla tua area riservata</h1>
            <p>Ciao ${mailingData.name || 'bellezza'},</p>
            <p>Hai richiesto di recuperare l'accesso alla tua area riservata. Clicca il pulsante qui sotto per accedere:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${accessUrl}" 
                 style="background: linear-gradient(135deg, #6AA8B3, #E46A39); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold;">
                Accedi Ora
              </a>
            </div>
            <p>Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
              ${accessUrl}
            </p>
            <p>Se non hai richiesto questo accesso, puoi ignorare questa email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              © 2024 4 Elementi Italia. Tutti i diritti riservati.
            </p>
          </div>
        `
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Error sending email:', errorData);
      throw new Error('Failed to send email');
    }

    console.log('Email sent successfully');
    */

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Access link sent successfully (simulated - configure RESEND_API_KEY to send real emails)',
      debug_access_url: accessUrl 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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