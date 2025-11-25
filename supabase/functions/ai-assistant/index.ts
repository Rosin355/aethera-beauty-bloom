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

    // Fetch user profile for personalization
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userContext = '';
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, experience_years, skills, bio')
        .eq('user_id', userId)
        .single();

      if (profile) {
        userContext = `
Informazioni utente:
- Nome: ${profile.display_name}
- Esperienza: ${profile.experience_years || 0} anni
- Competenze: ${profile.skills?.join(', ') || 'Non specificate'}
- Bio: ${profile.bio || 'Non disponibile'}
`;
      }
    }

    // Fetch knowledge base for context
    const { data: knowledgeBase } = await supabase
      .from('knowledge_base')
      .select('title, content, category')
      .order('created_at', { ascending: false })
      .limit(10);

    let kbContext = '';
    if (knowledgeBase && knowledgeBase.length > 0) {
      kbContext = '\n\nBase di Conoscenza:\n' + 
        knowledgeBase.map(kb => `[${kb.category}] ${kb.title}: ${kb.content}`).join('\n\n');
    }

    const systemPrompt = `Sei un assistente AI specializzato nel settore dell'estetica e bellezza, parte della piattaforma 4 Elementi Italia. 
Il tuo ruolo è supportare i professionisti del settore fornendo consigli pratici, suggerimenti operativi e supporto nella gestione della loro attività.

${userContext}

Linee guida:
- Rispondi sempre in italiano
- Sii professionale ma cordiale
- Fornisci consigli pratici e attuabili
- Usa il contesto dell'utente per personalizzare le risposte
- Se non conosci la risposta, ammettilo e suggerisci dove trovare informazioni
- Concentrati su: gestione clienti, marketing, tecniche di trattamento, business management, formazione continua
${kbContext}`;

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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite richieste superato. Riprova tra poco.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crediti AI esauriti. Contatta l\'amministratore.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Errore nella comunicazione con l\'AI');
    }

    const data = await response.json();
    
    // Save chat history
    if (userId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      const assistantMessage = data.choices[0].message.content;
      
      await supabase.from('chat_history').insert([
        {
          user_id: userId,
          message: lastUserMessage.content,
          role: 'user',
        },
        {
          user_id: userId,
          message: assistantMessage,
          role: 'assistant',
        },
      ]);
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