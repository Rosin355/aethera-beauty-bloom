import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FileSpreadsheet, FileJson, FileText, Database, Loader2, Trash2, RefreshCw, Zap, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

interface TrainingData {
  id: string;
  title: string;
  description: string | null;
  content: string;
  data_type: string;
  file_name: string | null;
  file_size: number | null;
  processed: boolean;
  is_active: boolean;
  created_at: string;
  embedding: any | null;
}

interface RecentFilesListProps {
  refreshTrigger?: number;
}

const RecentFilesList = ({ refreshTrigger }: RecentFilesListProps) => {
  const [data, setData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingEmbedding, setGeneratingEmbedding] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: trainingData, error } = await supabase
        .from('ai_training_data')
        .select('id, title, description, content, data_type, file_name, file_size, processed, is_active, created_at, embedding')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      const normalizedData = (trainingData || []).map(item => ({
        ...item,
        is_active: item.is_active ?? true,
      }));

      setData(normalizedData);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedding = async (item: TrainingData) => {
    setGeneratingEmbedding(item.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `https://jybewogjncaoscrnlqum.supabase.co/functions/v1/generate-embedding`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: item.content,
            documentId: item.id
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Errore nella generazione embedding');
      }

      toast.success(`Embedding generato per "${item.title}"`);
      fetchData();
    } catch (error) {
      console.error('Embedding generation error:', error);
      toast.error('Errore nella generazione embedding');
    } finally {
      setGeneratingEmbedding(null);
    }
  };

  const generateAllMissingEmbeddings = async () => {
    const missingEmbeddings = data.filter(item => !item.embedding);
    if (missingEmbeddings.length === 0) {
      toast.info('Tutti i documenti hanno già un embedding');
      return;
    }

    setGeneratingAll(true);
    let successCount = 0;
    let errorCount = 0;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    for (const item of missingEmbeddings) {
      try {
        const response = await fetch(
          `https://jybewogjncaoscrnlqum.supabase.co/functions/v1/generate-embedding`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: item.content,
              documentId: item.id
            }),
          }
        );

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setGeneratingAll(false);
    fetchData();

    if (errorCount === 0) {
      toast.success(`${successCount} embedding generati con successo!`);
    } else {
      toast.warning(`${successCount} generati, ${errorCount} errori`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_training_data')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Elemento eliminato');
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const handleMarkProcessed = async (id: string, processed: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_training_data')
        .update({ processed: !processed })
        .eq('id', id);

      if (error) throw error;

      toast.success(processed ? 'Segnato come non elaborato' : 'Segnato come elaborato');
      fetchData();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_training_data')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(isActive ? 'Documento disattivato' : 'Documento attivato');
      fetchData();
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const getFileIcon = (dataType: string, fileName: string | null) => {
    if (dataType === 'manual') {
      return <Database className="h-5 w-5 text-blue-500" />;
    }
    
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'json':
        return <FileJson className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const missingEmbeddingsCount = data.filter(item => !item.embedding).length;

  if (loading) {
    return (
      <div className="mt-6 flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground">Dati Recenti</h3>
        <div className="flex items-center gap-2">
          {missingEmbeddingsCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateAllMissingEmbeddings}
              disabled={generatingAll}
              className="text-brand-water border-brand-water/30 hover:bg-brand-water/10"
            >
              {generatingAll ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Indicizzazione...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  Indicizza tutti ({missingEmbeddingsCount})
                </>
              )}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchData}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Aggiorna
          </Button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-neutral-800 rounded-md">
          <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nessun dato caricato</p>
          <p className="text-sm mt-1">Carica un file o inserisci dati manualmente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div 
              key={item.id} 
              className={`flex justify-between items-center p-3 border border-neutral-800 rounded-md transition-colors ${
                item.is_active 
                  ? 'bg-neutral-900/50 hover:bg-neutral-800/50' 
                  : 'bg-neutral-900/20 opacity-60'
              }`}
            >
              <div className="flex items-center flex-1 min-w-0">
                {getFileIcon(item.data_type, item.file_name)}
                <div className="ml-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{item.title}</p>
                    {item.embedding ? (
                      <span className="flex items-center gap-1 text-xs text-green-500" title="Indicizzato per ricerca semantica">
                        <Zap className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-500" title="Embedding mancante">
                        <AlertCircle className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}</span>
                    {item.file_size && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(item.file_size)}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="capitalize">{item.data_type === 'manual' ? 'Manuale' : 'File'}</span>
                    {item.embedding && (
                      <>
                        <span>•</span>
                        <span className="text-green-500">Indicizzato</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {!item.embedding && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateEmbedding(item)}
                    disabled={generatingEmbedding === item.id}
                    className="text-brand-water hover:text-brand-water/80"
                    title="Genera embedding"
                  >
                    {generatingEmbedding === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {item.embedding && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateEmbedding(item)}
                    disabled={generatingEmbedding === item.id}
                    className="text-muted-foreground hover:text-brand-water"
                    title="Rigenera embedding"
                  >
                    {generatingEmbedding === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {item.is_active ? 'Attivo' : 'Inattivo'}
                  </span>
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                  />
                </div>
                <Badge 
                  className={`cursor-pointer ${item.processed ? 'bg-green-500' : 'bg-amber-500'}`}
                  onClick={() => handleMarkProcessed(item.id, item.processed)}
                >
                  {item.processed ? 'Elaborato' : 'In attesa'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentFilesList;
