import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== AI Assistant Edge Function Invoked ===');
  console.log('Method:', req.method);
  console.log('Timestamp:', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    console.log('Request body parsed successfully');
    console.log('User ID:', userId || 'anonymous');
    console.log('Messages count:', messages?.length || 0);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('ERROR: LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY non configurata');
    }
    console.log('LOVABLE_API_KEY found');

    // Initialize Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');

    // Fetch user profile for personalization
    let userContext = '';
    if (userId) {
      console.log('Fetching user profile for personalization...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, experience_years, skills, bio, user_type, experience_level, business_name, city, primary_goal, growth_plan, preferred_learning_format, time_availability, team_size')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.log('Profile fetch error (non-critical):', profileError.message);
      } else if (profile) {
        console.log('User profile found:', profile.display_name);
        const userTypeLabel = profile.user_type === 'professional' ? 'Professionista del settore estetica' : 'Utente interessato al settore';
        userContext = `
PROFILO UTENTE ATTUALE:
- Nome: ${profile.display_name || 'Non specificato'}
- Tipo utente: ${userTypeLabel}
- Nome attività: ${profile.business_name || 'Non specificato'}
- Città: ${profile.city || 'Non specificata'}
- Livello esperienza: ${profile.experience_level || 'Non specificato'}
- Anni esperienza: ${profile.experience_years || 'Non specificati'}
- Dimensione team: ${profile.team_size || 'Non specificata'}
- Obiettivo principale: ${profile.primary_goal || 'Non specificato'}
- Piano di crescita: ${profile.growth_plan || 'Non specificato'}
- Formato apprendimento preferito: ${profile.preferred_learning_format || 'Non specificato'}
- Disponibilità tempo: ${profile.time_availability || 'Non specificata'}
- Competenze: ${profile.skills?.join(', ') || 'Non specificate'}
- Bio: ${profile.bio || 'Non disponibile'}

IMPORTANTE: Personalizza le tue risposte in base a questo profilo. Se l'utente è un professionista con esperienza, usa terminologia tecnica. Se è nuovo nel settore, spiega i concetti più semplicemente.`;
      }
    }

    // Fetch AI system configuration (operational modules)
    console.log('Fetching AI system configuration...');
    const { data: systemConfig, error: configError } = await supabase
      .from('ai_system_config')
      .select('config_key, config_value, description')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (configError) {
      console.log('System config fetch error (non-critical):', configError.message);
    } else {
      console.log('System config items found:', systemConfig?.length || 0);
    }

    let systemInstructions = '';
    if (systemConfig && systemConfig.length > 0) {
      systemInstructions = '\n\nCAPACITÀ OPERATIVE E MODULI DISPONIBILI:\n';
      systemConfig.forEach((config) => {
        if (config.config_key !== 'general_context') {
          systemInstructions += `\n${config.config_value}\n`;
        }
      });
      
      const generalContext = systemConfig.find(c => c.config_key === 'general_context');
      if (generalContext) {
        systemInstructions = `\n${generalContext.config_value}\n` + systemInstructions;
      }
    }

    // Fetch AI training data (uploaded files and manual entries)
    console.log('Fetching AI training data...');
    const { data: trainingData, error: trainingError } = await supabase
      .from('ai_training_data')
      .select('title, description, content, data_type')
      .order('created_at', { ascending: false })
      .limit(30);

    if (trainingError) {
      console.log('Training data fetch error (non-critical):', trainingError.message);
    } else {
      console.log('Training documents found:', trainingData?.length || 0);
    }

    let trainingContext = '';
    if (trainingData && trainingData.length > 0) {
      trainingContext = '\n\nBASE DI CONOSCENZA (Documenti e dati caricati dagli amministratori - usa queste informazioni per rispondere in modo specifico):\n';
      trainingData.forEach((item, index) => {
        trainingContext += `\n--- Documento ${index + 1}: ${item.title} ---\n`;
        if (item.description) {
          trainingContext += `Descrizione: ${item.description}\n`;
        }
        if (item.data_type) {
          trainingContext += `Tipo: ${item.data_type}\n`;
        }
        const contentPreview = item.content.length > 3000 
          ? item.content.substring(0, 3000) + '... [contenuto troncato]'
          : item.content;
        trainingContext += `Contenuto:\n${contentPreview}\n`;
      });
    }

    const systemPrompt = `Sei l'assistente AI di 4 Elementi Italia, una piattaforma completa dedicata ai professionisti del settore estetica e bellezza.

IDENTITÀ E MISSIONE:
Sei un consulente esperto e affidabile che supporta titolari di centri estetici, estetiste e operatori del settore fornendo consulenza operativa, strategica e formativa. Il tuo obiettivo è aiutare i professionisti a far crescere la loro attività, ottimizzare i processi e raggiungere i loro obiettivi di business.
${systemInstructions}
${userContext}

LINEE GUIDA DI COMUNICAZIONE:
- Rispondi SEMPRE in italiano
- Sii professionale ma cordiale, empatico e incoraggiante
- Fornisci consigli pratici, specifici e immediatamente attuabili
- Usa esempi concreti dal settore estetica quando possibile
- Se non conosci la risposta, ammettilo e suggerisci come l'utente può trovare l'informazione
- Quando appropriato, fai riferimento ai moduli e funzionalità della piattaforma 4 Elementi
- Struttura le risposte lunghe con elenchi puntati o numerati per chiarezza

AREE DI COMPETENZA SPECIFICHE:
1. Gestione operativa del centro estetico
2. Marketing e comunicazione (social media, contenuti, promozioni)
3. Gestione clienti, fidelizzazione e CRM
4. Analisi KPI e performance finanziaria
5. Gestione team, formazione e incentivi
6. Protocolli trattamenti e best practices
7. Pricing, listini e marginalità
8. Ottimizzazione magazzino e inventario
${trainingContext}`;

    console.log('System prompt built successfully');
    console.log(`Context lengths - User: ${userContext.length}, Training: ${trainingContext.length}, System: ${systemInstructions.length}`);
    
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

    console.log('AI Gateway response status:', response.status);

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
    console.log('Response tokens used:', data.usage?.total_tokens || 'unknown');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('=== ERROR in ai-assistant ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
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