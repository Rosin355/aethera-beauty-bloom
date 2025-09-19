import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsletterRequest {
  subject: string;
  content: string;
  recipients?: string[]; // Se non specificato, invia a tutti
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
    
    const { subject, content, recipients }: NewsletterRequest = await req.json();

    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: 'Subject and content are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Preparing newsletter send...');

    // Get recipients from newsletter_subscriptions if not specified
    let emailList: string[] = recipients || [];
    
    if (!recipients || recipients.length === 0) {
      const { data: subscriptions, error } = await supabase
        .from('newsletter_subscriptions')
        .select('email, name');

      if (error) {
        console.error('Error fetching newsletter subscriptions:', error);
        throw new Error('Failed to fetch newsletter subscriptions');
      }

      emailList = subscriptions?.map(sub => sub.email) || [];
    }

    if (emailList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No recipients found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Sending newsletter to ${emailList.length} recipients`);

    // Send newsletter with Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping newsletter send');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Newsletter send skipped - API key not configured',
        recipients_count: emailList.length 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send newsletter in batches to avoid rate limits
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < emailList.length; i += batchSize) {
      batches.push(emailList.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;
    const failedEmails: string[] = [];
    const emailIds: string[] = [];

    for (const batch of batches) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '4 Elementi Italia <newsletter@4elementiitalia.it>',
            to: batch,
            subject: subject,
            html: `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #1B1B1B, #2D2D2D); color: white; padding: 40px 30px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: #6AA8B3; text-align: center; margin-bottom: 20px; font-family: 'Playfair Display', serif;">
                    4 Elementi Italia Newsletter
                  </h1>
                </div>
                <div style="background: white; padding: 30px; color: #333; line-height: 1.6;">
                  ${content}
                </div>
                <div style="background: #F6F4ED; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
                  <p style="margin: 0; color: #666; font-size: 12px;">
                    © 2024 4 Elementi Italia. Tutti i diritti riservati.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
                    <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://4elementiitalia.it'}/unsubscribe?email={{email}}" style="color: #6AA8B3;">Annulla iscrizione</a>
                  </p>
                </div>
              </div>
            `
          }),
        });

        if (emailResponse.ok) {
          const responseData = await emailResponse.json();
          successCount += batch.length;
          if (responseData.id) emailIds.push(responseData.id);
          console.log(`Newsletter batch sent successfully to ${batch.length} recipients`);
        } else {
          const errorData = await emailResponse.text();
          errorCount += batch.length;
          failedEmails.push(...batch);
          console.error('Error sending newsletter batch:', errorData);
        }

        // Add delay between batches to respect rate limits (100 emails/second limit)
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error('Error sending newsletter batch:', error);
        errorCount += batch.length;
        failedEmails.push(...batch);
      }
    }

    console.log(`Newsletter sent: ${successCount} success, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Newsletter sent to ${successCount} recipients${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
      recipients_count: emailList.length,
      success_count: successCount,
      error_count: errorCount,
      failed_emails: failedEmails,
      email_ids: emailIds,
      subject: subject
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in send-newsletter function:', error);
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