import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  HttpError,
  requireAuthenticatedUser,
  toErrorResponse,
} from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback base prompt used only when ai_system_config has no active 'system_prompt' row.
const DEFAULT_SYSTEM_PROMPT = `Sei l'assistente AI di 4 Elementi Italia, una piattaforma completa dedicata ai professionisti del settore estetica e bellezza.

IDENTITÀ E MISSIONE:
Sei un consulente esperto e affidabile che supporta titolari di centri estetici, estetiste e operatori del settore fornendo consulenza operativa, strategica e formativa. Il tuo obiettivo è aiutare i professionisti a far crescere la loro attività, ottimizzare i processi e raggiungere i loro obiettivi di business.

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
8. Ottimizzazione magazzino e inventario`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { supabase, user } = await requireAuthenticatedUser(req);
    const { messages, conversationId } = await req.json();
    const authenticatedUserId = user.id;

    if (!Array.isArray(messages) || messages.length === 0) {
      throw new HttpError(400, "Messaggi non validi");
    }

    // Input hardening: cap conversation size, reject oversized payloads, and only
    // accept user/assistant roles (a client must never inject a "system" message,
    // nor malformed roles/content).
    const MAX_MESSAGES = 30;
    const MAX_MESSAGES_BYTES = 32 * 1024;
    if (messages.length > MAX_MESSAGES) {
      throw new HttpError(400, "Troppi messaggi nella conversazione");
    }
    if (new TextEncoder().encode(JSON.stringify(messages)).length > MAX_MESSAGES_BYTES) {
      throw new HttpError(413, "Payload dei messaggi troppo grande");
    }
    const sanitizedMessages = messages.map((message: unknown) => {
      const role = (message as { role?: unknown })?.role;
      const content = (message as { content?: unknown })?.content;
      if (typeof content !== "string" || (role !== "user" && role !== "assistant")) {
        throw new HttpError(400, "Formato messaggio non valido");
      }
      return { role, content };
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurata');
    }

    // Fetch user profile for personalization
    let userContext = '';
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, experience_years, skills, bio, user_type, experience_level, business_name, city, primary_goal, growth_plan, preferred_learning_format, time_availability, team_size')
      .eq('user_id', authenticatedUserId)
      .single();

    if (!profileError && profile) {
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

    let validatedConversationId: string | null = null;
    if (typeof conversationId === "string" && conversationId.trim().length > 0) {
      const { data: ownedConversation, error: conversationError } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", authenticatedUserId)
        .maybeSingle();

      if (!conversationError && ownedConversation) {
        validatedConversationId = ownedConversation.id;
      }
    }

    // Fetch AI system configuration (operational modules)
    const { data: systemConfig } = await supabase
      .from('ai_system_config')
      .select('config_key, config_value, description')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Base system prompt comes from ai_system_config ('system_prompt'); fall back to default.
    const systemPromptRow = systemConfig?.find((c) => c.config_key === 'system_prompt');
    const baseSystemPrompt = systemPromptRow?.config_value?.trim()
      ? systemPromptRow.config_value
      : DEFAULT_SYSTEM_PROMPT;

    let systemInstructions = '';
    if (systemConfig && systemConfig.length > 0) {
      systemInstructions = '\n\nCAPACITÀ OPERATIVE E MODULI DISPONIBILI:\n';
      systemConfig.forEach((config) => {
        if (config.config_key !== 'general_context' && config.config_key !== 'system_prompt') {
          systemInstructions += `\n${config.config_value}\n`;
        }
      });

      const generalContext = systemConfig.find(c => c.config_key === 'general_context');
      if (generalContext) {
        systemInstructions = `\n${generalContext.config_value}\n` + systemInstructions;
      }
    }

    // Lightweight keyword retrieval (full-text) over the 4E knowledge base — no embeddings.
    const lastUserMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || '';

    let docs: Array<{ title: string; description?: string | null; content: string }> = [];
    const { data: matches, error: matchError } = await supabase.rpc('match_training_data_fts', {
      query_text: lastUserMessage,
      match_count: 4,
    });

    if (!matchError && Array.isArray(matches) && matches.length > 0) {
      docs = matches as typeof docs;
    } else {
      // Fallback: most recent active documents when full-text finds nothing (or errors).
      const { data: recent } = await supabase
        .from('ai_training_data')
        .select('title, description, content')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);
      if (recent) docs = recent;
    }

    let trainingContext = '';
    if (docs.length > 0) {
      trainingContext = '\n\nMATERIALE DI RIFERIMENTO (basa la risposta su questi contenuti del metodo 4 Elementi):\n';
      docs.forEach((item, index) => {
        trainingContext += `\n--- Documento ${index + 1}: ${item.title} ---\n`;
        if (item.description) {
          trainingContext += `Descrizione: ${item.description}\n`;
        }
        const contentPreview = item.content.length > 4000
          ? item.content.substring(0, 4000) + '... [contenuto troncato]'
          : item.content;
        trainingContext += `Contenuto:\n${contentPreview}\n`;
      });
    }

    const systemPrompt = `${baseSystemPrompt}
${systemInstructions}
${userContext}
${trainingContext}`;

    const modelName = 'google/gemini-2.5-flash';
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      await response.text();
      console.error('AI gateway error:', response.status);
      
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

    // Log usage asynchronously (don't block the response)
    const responseTime = Date.now() - startTime;
    EdgeRuntime.waitUntil((async () => {
      try {
        // Estimate token counts (rough approximation)
        const inputTokens = Math.ceil((systemPrompt.length + sanitizedMessages.reduce((acc: number, m: { content?: string }) => acc + (m.content?.length ?? 0), 0)) / 4);
        
        await supabase.from('ai_usage_logs').insert({
          user_id: authenticatedUserId,
          conversation_id: validatedConversationId,
          tokens_input: inputTokens,
          tokens_output: null, // We can't easily track streaming output tokens
          model: modelName,
          response_time_ms: responseTime,
        });
      } catch (logError) {
        console.error('Error saving usage log');
      }
    })());

    // Return the streaming response directly
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    if (!(error instanceof HttpError)) {
      console.error('Error in ai-assistant');
    }
    return toErrorResponse(error, corsHeaders);
  }
});
