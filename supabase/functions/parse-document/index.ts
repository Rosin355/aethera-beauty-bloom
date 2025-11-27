import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('Nessun file fornito');
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    let extractedText = '';

    console.log(`Processing file: ${fileName}, size: ${file.size} bytes`);

    if (fileName.endsWith('.odt')) {
      extractedText = await extractODT(arrayBuffer);
    } else if (fileName.endsWith('.docx')) {
      extractedText = await extractDOCX(arrayBuffer);
    } else if (fileName.endsWith('.pdf')) {
      extractedText = await extractPDFBasic(arrayBuffer);
    } else if (fileName.endsWith('.doc')) {
      // .doc files are binary and harder to parse, try basic extraction
      extractedText = await extractDOCBasic(arrayBuffer);
    } else {
      throw new Error(`Formato file non supportato: ${fileName}`);
    }

    console.log(`Extracted ${extractedText.length} characters from ${fileName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: extractedText,
        fileName: file.name,
        fileSize: file.size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing document:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Errore sconosciuto' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Extract text from ODT (OpenDocument Text) files
async function extractODT(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);
    
    const contentFile = zip.file('content.xml');
    if (!contentFile) {
      throw new Error('content.xml non trovato nel file ODT');
    }
    
    const contentXml = await contentFile.async('string');
    return extractTextFromXML(contentXml);
  } catch (error) {
    console.error('Error extracting ODT:', error);
    throw new Error(`Errore nell'estrazione del file ODT: ${error instanceof Error ? error.message : 'sconosciuto'}`);
  }
}

// Extract text from DOCX (Microsoft Word) files
async function extractDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(arrayBuffer);
    
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) {
      throw new Error('document.xml non trovato nel file DOCX');
    }
    
    const documentXml = await documentFile.async('string');
    return extractTextFromDocxXML(documentXml);
  } catch (error) {
    console.error('Error extracting DOCX:', error);
    throw new Error(`Errore nell'estrazione del file DOCX: ${error instanceof Error ? error.message : 'sconosciuto'}`);
  }
}

// Basic PDF text extraction (extracts readable text streams)
async function extractPDFBasic(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('latin1').decode(bytes);
    
    // Extract text between BT (Begin Text) and ET (End Text) markers
    const textContent: string[] = [];
    const regex = /BT[\s\S]*?ET/g;
    const matches = text.match(regex) || [];
    
    for (const match of matches) {
      // Extract text from Tj and TJ operators
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(match)) !== null) {
        textContent.push(decodePDFText(tjMatch[1]));
      }
      
      // Extract from TJ arrays
      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      let tjArrayMatch;
      while ((tjArrayMatch = tjArrayRegex.exec(match)) !== null) {
        const arrayContent = tjArrayMatch[1];
        const stringRegex = /\(([^)]*)\)/g;
        let stringMatch;
        while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
          textContent.push(decodePDFText(stringMatch[1]));
        }
      }
    }
    
    let result = textContent.join(' ').trim();
    
    // If no text found with BT/ET method, try simpler extraction
    if (result.length < 50) {
      result = extractSimplePDFText(text);
    }
    
    if (result.length < 10) {
      return `[Contenuto PDF - Il file potrebbe contenere principalmente immagini o testo non estraibile. Nome file originale preservato per riferimento.]`;
    }
    
    return cleanText(result);
  } catch (error) {
    console.error('Error extracting PDF:', error);
    return `[Errore estrazione PDF: ${error instanceof Error ? error.message : 'sconosciuto'}]`;
  }
}

// Basic DOC extraction (legacy Word format)
async function extractDOCBasic(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('latin1').decode(bytes);
    
    // DOC files have text scattered, try to extract readable portions
    const readable = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    const words = readable.match(/[a-zA-ZÀ-ÿ0-9]{2,}/g) || [];
    
    if (words.length < 10) {
      return `[Contenuto DOC - Formato legacy, potrebbe richiedere conversione manuale a DOCX per migliore estrazione]`;
    }
    
    return cleanText(words.join(' '));
  } catch (error) {
    console.error('Error extracting DOC:', error);
    return `[Errore estrazione DOC: ${error instanceof Error ? error.message : 'sconosciuto'}]`;
  }
}

// Helper: Extract text from ODT XML
function extractTextFromXML(xml: string): string {
  const textContent: string[] = [];
  
  // Use regex to extract text from text:p and text:span elements
  const textRegex = /<text:[^>]*>([^<]*)<\/text:[^>]*>/g;
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    if (match[1].trim()) {
      textContent.push(match[1].trim());
    }
  }
  
  // Also try simpler extraction
  const simpleRegex = />([^<]+)</g;
  while ((match = simpleRegex.exec(xml)) !== null) {
    const text = match[1].trim();
    if (text && text.length > 1 && !/^[\s\d.,-]+$/.test(text)) {
      textContent.push(text);
    }
  }
  
  return cleanText([...new Set(textContent)].join(' '));
}

// Helper: Extract text from DOCX XML
function extractTextFromDocxXML(xml: string): string {
  const textContent: string[] = [];
  
  // Extract text from w:t elements
  const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    if (match[1]) {
      textContent.push(match[1]);
    }
  }
  
  return cleanText(textContent.join(' '));
}

// Helper: Decode PDF text escapes
function decodePDFText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

// Helper: Simple PDF text extraction
function extractSimplePDFText(text: string): string {
  const readable: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Look for lines that seem to contain readable text
    if (/[a-zA-ZÀ-ÿ]{3,}/.test(line)) {
      const cleaned = line.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ').trim();
      if (cleaned.length > 5) {
        readable.push(cleaned);
      }
    }
  }
  
  return readable.join(' ');
}

// Helper: Clean extracted text
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}
