import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurata');
    }

    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user profile for personalization
    let userContext = '';
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, experience_years, skills, bio, user_type, experience_level, business_name, city, primary_goal, growth_plan, preferred_learning_format, time_availability')
        .eq('user_id', userId)
        .single();

      if (profile) {
        const userTypeLabel = profile.user_type === 'professional' ? 'Professionista del settore estetica' : 'Utente interessato al settore';
        userContext = `
INFORMAZIONI UTENTE:
- Nome: ${profile.display_name || 'Non specificato'}
- Tipo utente: ${userTypeLabel}
- Nome attività: ${profile.business_name || 'Non specificato'}
- Città: ${profile.city || 'Non specificata'}
- Livello esperienza: ${profile.experience_level || 'Non specificato'}
- Anni esperienza: ${profile.experience_years || 'Non specificati'}
- Obiettivo principale: ${profile.primary_goal || 'Non specificato'}
- Piano di crescita: ${profile.growth_plan || 'Non specificato'}
- Formato apprendimento preferito: ${profile.preferred_learning_format || 'Non specificato'}
- Disponibilità tempo: ${profile.time_availability || 'Non specificata'}
- Competenze: ${profile.skills?.join(', ') || 'Non specificate'}
- Bio: ${profile.bio || 'Non disponibile'}
`;
      }
    }

    // Fetch AI training data (uploaded files and manual entries)
    const { data: trainingData } = await supabase
      .from('ai_training_data')
      .select('title, description, content, data_type')
      .order('created_at', { ascending: false })
      .limit(20);

    let trainingContext = '';
    if (trainingData && trainingData.length > 0) {
      trainingContext = '\n\nBASE DI CONOSCENZA (Dati di training caricati dagli amministratori):\n';
      trainingData.forEach((item, index) => {
        trainingContext += `\n--- Documento ${index + 1}: ${item.title} ---\n`;
        if (item.description) {
          trainingContext += `Descrizione: ${item.description}\n`;
        }
        if (item.data_type) {
          trainingContext += `Tipo: ${item.data_type}\n`;
        }
        trainingContext += `Contenuto:\n${item.content}\n`;
      });
    }

    const systemPrompt = `Sei un assistente AI esperto nel settore dell'estetica e bellezza, parte della piattaforma 4 Elementi Italia.
Il tuo ruolo è supportare i professionisti del settore fornendo consigli pratici, suggerimenti operativi e supporto nella gestione della loro attività.

${userContext}

LINEE GUIDA:
- Rispondi SEMPRE in italiano
- Sii professionale ma cordiale e empatico
- Personalizza le risposte in base al profilo dell'utente (tipo, esperienza, obiettivi)
- Fornisci consigli pratici, specifici e attuabili
- Se l'utente è un professionista, usa terminologia tecnica appropriata
- Se l'utente è nuovo nel settore, spiega i concetti in modo più semplice
- Se non conosci la risposta, ammettilo onestamente e suggerisci risorse alternative
- Usa i dati della base di conoscenza per fornire informazioni accurate e specifiche per 4 Elementi Italia

AREE DI COMPETENZA:
- Gestione clienti e fidelizzazione
- Marketing e comunicazione per centri estetici
- Tecniche di trattamento e tendenze del settore
- Business management e crescita aziendale
- Formazione continua e sviluppo professionale
- Pricing e strategie di vendita
- Social media e presenza online
- Gestione del team e leadership
${trainingContext}`;

    console.log('Sending request to Lovable AI Gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite richieste superato. Riprova tra qualche secondo.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crediti AI esauriti. Contatta l\'amministratore.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Errore nella comunicazione con l'AI: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received successfully');
    
    // Save chat history for future reference
    if (userId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      const assistantMessage = data.choices[0].message.content;
      
      // Note: chat_history table would need to be created if you want to persist conversations
      // For now, we'll skip this as it's optional
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-assistant:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Errore sconosciuto' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
