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

    // Generate embedding for user's query for semantic search
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const queryEmbedding = generateSimpleEmbedding(lastUserMessage);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Semantic search for relevant training data
    const { data: semanticResults, error: semanticError } = await supabase
      .rpc('search_training_data', {
        query_embedding: embeddingStr,
        match_threshold: 0.3,
        match_count: 5
      });

    let trainingContext = '';
    if (semanticError) {
      // Fallback to standard fetch if semantic search fails
      const { data: trainingData, error: trainingError } = await supabase
        .from('ai_training_data')
        .select('title, description, content, data_type')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!trainingError && trainingData && trainingData.length > 0) {
        trainingContext = '\n\nBASE DI CONOSCENZA:\n';
        trainingData.forEach((item, index) => {
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
    } else if (semanticResults && semanticResults.length > 0) {
      trainingContext = '\n\nDOCUMENTI PERTINENTI (selezionati in base alla tua domanda):\n';
      semanticResults.forEach((item: { title: string; similarity: number; description?: string | null; content: string }, index: number) => {
        trainingContext += `\n--- Documento ${index + 1}: ${item.title} (rilevanza: ${Math.round(item.similarity * 100)}%) ---\n`;
        if (item.description) {
          trainingContext += `Descrizione: ${item.description}\n`;
        }
        const contentPreview = item.content.length > 5000 
          ? item.content.substring(0, 5000) + '... [contenuto troncato]'
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
          ...messages,
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
        const inputTokens = Math.ceil((systemPrompt.length + messages.reduce((acc: number, m: { content?: string }) => acc + (m.content?.length ?? 0), 0)) / 4);
        
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

// Simple embedding function using TF-IDF-like approach
// Creates a 768-dimension vector from text content
function generateSimpleEmbedding(text: string): number[] {
  const dimension = 768;
  const embedding = new Array(dimension).fill(0);
  
  // Normalize and tokenize
  const normalized = text.toLowerCase().replace(/[^a-zàèéìòù0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  if (words.length === 0) {
    for (let i = 0; i < dimension; i++) {
      embedding[i] = (Math.random() - 0.5) * 0.1;
    }
    return normalizeVector(embedding);
  }
  
  // Word frequency map
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Hash each word to specific dimensions
  Object.entries(wordFreq).forEach(([word, freq]) => {
    for (let h = 0; h < 3; h++) {
      const hash = hashString(word + h.toString());
      const pos = Math.abs(hash) % dimension;
      const sign = hash > 0 ? 1 : -1;
      embedding[pos] += sign * Math.log(1 + freq) / words.length;
    }
    
    // Character n-gram features
    for (let i = 0; i < word.length - 1; i++) {
      const bigram = word.substring(i, i + 2);
      const bigramHash = hashString('bg_' + bigram);
      const bigramPos = Math.abs(bigramHash) % dimension;
      embedding[bigramPos] += (bigramHash > 0 ? 1 : -1) * 0.1 / words.length;
    }
  });
  
  // Structural features
  const uniqueWordRatio = Object.keys(wordFreq).length / words.length;
  embedding[0] = uniqueWordRatio;
  embedding[1] = Math.log(1 + words.length) / 10;
  embedding[2] = text.split(/[.!?]/).length / 100;
  
  return normalizeVector(embedding);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

function normalizeVector(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) {
    return vec.map(() => 1 / Math.sqrt(vec.length));
  }
  return vec.map(val => val / magnitude);
}
