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

    // TODO: Quando sarà configurato Resend, qui invieremo email di conferma newsletter
    // await sendNewsletterConfirmation(email, name);

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

  } catch (error: any) {
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