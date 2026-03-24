import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  to: string;
  testType?: 'custom' | 'default' | 'both';
}

interface EmailTestResult {
  type: 'custom_domain' | 'resend_domain';
  from: string;
  success: boolean;
  status?: number;
  response?: unknown;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, testType = 'both' }: TestEmailRequest = await req.json();

    if (!to?.trim()) {
      return new Response(
        JSON.stringify({ error: "Email destinatario obbligatoria" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY non configurata" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const results: EmailTestResult[] = [];

    // Test con dominio personalizzato
    if (testType === 'custom' || testType === 'both') {
      console.log('🧪 Test email con dominio personalizzato: benvenuto@4elementiitalia.it');
      
      try {
        const customResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '4 Elementi Italia <benvenuto@4elementiitalia.it>',
            to: [to],
            subject: '🧪 Test Email - Dominio Personalizzato',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
                <h1 style="color: #1B1B1B;">Test Email - Dominio Personalizzato</h1>
                <p>Questa è un'email di test inviata da: <strong>benvenuto@4elementiitalia.it</strong></p>
                <p>Timestamp: ${new Date().toISOString()}</p>
                <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3>Informazioni del test:</h3>
                  <ul>
                    <li><strong>Destinatario:</strong> ${to}</li>
                    <li><strong>Mittente:</strong> benvenuto@4elementiitalia.it</li>
                    <li><strong>Tipo test:</strong> Dominio personalizzato</li>
                  </ul>
                </div>
                <p style="color: #666; font-size: 12px;">Se ricevi questa email, il dominio personalizzato funziona correttamente!</p>
              </div>
            `
          }),
        });

        const customData = await customResponse.text();
        console.log('📊 Risposta test dominio personalizzato:', {
          status: customResponse.status,
          statusText: customResponse.statusText,
          body: customData
        });

        results.push({
          type: 'custom_domain',
          from: 'benvenuto@4elementiitalia.it',
          success: customResponse.ok,
          status: customResponse.status,
          response: customResponse.ok ? JSON.parse(customData) : customData
        });

      } catch (error) {
        console.error('❌ Errore test dominio personalizzato:', error);
        results.push({
          type: 'custom_domain',
          from: 'benvenuto@4elementiitalia.it',
          success: false,
          error: error.message
        });
      }
    }

    // Test con dominio Resend di default
    if (testType === 'default' || testType === 'both') {
      console.log('🧪 Test email con dominio Resend di default: onboarding@resend.dev');
      
      try {
        const defaultResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '4 Elementi Italia <onboarding@resend.dev>',
            to: [to],
            subject: '🧪 Test Email - Dominio Resend',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f0f8ff;">
                <h1 style="color: #1B1B1B;">Test Email - Dominio Resend</h1>
                <p>Questa è un'email di test inviata da: <strong>onboarding@resend.dev</strong></p>
                <p>Timestamp: ${new Date().toISOString()}</p>
                <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3>Informazioni del test:</h3>
                  <ul>
                    <li><strong>Destinatario:</strong> ${to}</li>
                    <li><strong>Mittente:</strong> onboarding@resend.dev</li>
                    <li><strong>Tipo test:</strong> Dominio Resend predefinito</li>
                  </ul>
                </div>
                <p style="color: #666; font-size: 12px;">Se ricevi questa email, il dominio Resend predefinito funziona correttamente!</p>
              </div>
            `
          }),
        });

        const defaultData = await defaultResponse.text();
        console.log('📊 Risposta test dominio Resend:', {
          status: defaultResponse.status,
          statusText: defaultResponse.statusText,
          body: defaultData
        });

        results.push({
          type: 'resend_domain',
          from: 'onboarding@resend.dev',
          success: defaultResponse.ok,
          status: defaultResponse.status,
          response: defaultResponse.ok ? JSON.parse(defaultData) : defaultData
        });

      } catch (error) {
        console.error('❌ Errore test dominio Resend:', error);
        results.push({
          type: 'resend_domain',
          from: 'onboarding@resend.dev',
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalTests = results.length;

    console.log(`✅ Test completati: ${successCount}/${totalTests} successi`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Test completati: ${successCount}/${totalTests} email inviate con successo`,
        results,
        summary: {
          total_tests: totalTests,
          successful: successCount,
          failed: totalTests - successCount
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    console.error("🚨 Error in resend-test-email function:", error);
    return new Response(
      JSON.stringify({ error: "Errore interno del server", details: error instanceof Error ? error.message : "unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
