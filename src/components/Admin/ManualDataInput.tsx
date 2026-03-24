import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionUrl } from "@/lib/supabaseConfig";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ManualDataInputProps {
  onSaveComplete?: () => void;
}

const ManualDataInput = ({ onSaveComplete }: ManualDataInputProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error("Compila il titolo e il contenuto");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { data: insertData, error } = await supabase
        .from('ai_training_data')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          content: content.trim(),
          data_type: 'manual',
          processed: false
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving data:', error);
        throw error;
      }

      // Generate embedding for the content
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        await fetch(
          getEdgeFunctionUrl("generate-embedding"),
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: content.trim(),
              documentId: insertData.id
            }),
          }
        );
        console.log('Embedding generated successfully');
      } catch (embeddingError) {
        console.warn('Embedding generation failed (non-critical):', embeddingError);
      }

      toast.success('Dati salvati e indicizzati con successo!');
      setTitle("");
      setDescription("");
      setContent("");
      onSaveComplete?.();
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Errore nel salvataggio dei dati');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2 text-foreground">Inserimento Dati Strutturati</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Inserisci dati in formato strutturato per addestrare l'assistente AI
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="data-title" className="font-medium text-sm text-foreground">
              Titolo Dataset *
            </label>
            <Input 
              id="data-title" 
              placeholder="Es. Performance Trattamenti Q3 2023"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-neutral-800 border-neutral-700"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="data-description" className="font-medium text-sm text-foreground">
              Descrizione
            </label>
            <Input 
              id="data-description" 
              placeholder="Breve descrizione dei dati"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-neutral-800 border-neutral-700"
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="data-content" className="font-medium text-sm text-foreground">
              Contenuto *
            </label>
            <Textarea 
              id="data-content" 
              placeholder="Inserisci dati in formato JSON, CSV o testo strutturato"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] font-mono bg-neutral-800 border-neutral-700"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Suggerimento: Per JSON, usa il formato {"{"}"chiave": "valore"{"}"}
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
              className="border-neutral-700"
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              className="bg-brand-fire hover:bg-brand-fire/90"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                'Salva Dati'
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ManualDataInput;
