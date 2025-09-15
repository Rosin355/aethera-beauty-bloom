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
      
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ error: "Email già registrata" }),
          {
            status: 409,
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

    // TODO: Quando sarà configurato Resend, qui invieremo l'email di benvenuto
    // await sendWelcomeEmail(email, name, data.access_token);

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