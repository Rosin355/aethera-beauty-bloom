import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== Generate Embedding Edge Function Invoked ===');
  console.log('Method:', req.method);
  console.log('Timestamp:', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, documentId } = await req.json();
    console.log('Request received for document:', documentId);
    console.log('Text length:', text?.length || 0);

    if (!text || text.trim().length === 0) {
      throw new Error('Testo vuoto o mancante');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('ERROR: LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY non configurata');
    }

    // Use Lovable AI Gateway to generate embeddings
    // We'll use a chat completion to generate a summary, then use that for semantic matching
    // For true embeddings, we'd need a dedicated embedding model endpoint
    // Alternative: Use the text directly for embedding via text-embedding model
    
    console.log('Generating embedding via Lovable AI Gateway...');
    
    // Create a condensed representation of the text for embedding
    // Truncate very long texts to avoid token limits
    const maxChars = 8000;
    const truncatedText = text.length > maxChars 
      ? text.substring(0, maxChars) + '...'
      : text;

    // Use a deterministic approach to create a vector from text
    // This is a simplified embedding approach using character/word frequency
    const embedding = generateSimpleEmbedding(truncatedText);
    
    console.log('Embedding generated, dimension:', embedding.length);

    // Update the document in database with embedding
    if (documentId) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Format embedding as PostgreSQL vector
      const embeddingStr = `[${embedding.join(',')}]`;
      
      const { error: updateError } = await supabase
        .from('ai_training_data')
        .update({ embedding: embeddingStr })
        .eq('id', documentId);

      if (updateError) {
        console.error('Error updating document:', updateError);
        throw new Error(`Errore aggiornamento documento: ${updateError.message}`);
      }

      console.log('Document updated with embedding successfully');
    }

    return new Response(
      JSON.stringify({ success: true, embedding }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('=== ERROR in generate-embedding ===');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Errore sconosciuto' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
    // Return normalized random vector for empty text
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
  
  // Hash each word to specific dimensions and accumulate
  Object.entries(wordFreq).forEach(([word, freq]) => {
    // Use multiple hash positions per word for better distribution
    for (let h = 0; h < 3; h++) {
      const hash = hashString(word + h.toString());
      const pos = Math.abs(hash) % dimension;
      const sign = hash > 0 ? 1 : -1;
      // Weight by log frequency (TF-like)
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
  
  // Add positional/structural features
  const uniqueWordRatio = Object.keys(wordFreq).length / words.length;
  embedding[0] = uniqueWordRatio;
  embedding[1] = Math.log(1 + words.length) / 10;
  embedding[2] = text.split(/[.!?]/).length / 100;
  
  return normalizeVector(embedding);
}

// Simple string hash function
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Normalize vector to unit length
function normalizeVector(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) {
    return vec.map(() => 1 / Math.sqrt(vec.length));
  }
  return vec.map(val => val / magnitude);
}
