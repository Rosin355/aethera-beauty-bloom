import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileJson, FileText, Database, Loader2, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

interface TrainingData {
  id: string;
  title: string;
  description: string | null;
  data_type: string;
  file_name: string | null;
  file_size: number | null;
  processed: boolean;
  created_at: string;
}

interface RecentFilesListProps {
  refreshTrigger?: number;
}

const RecentFilesList = ({ refreshTrigger }: RecentFilesListProps) => {
  const [data, setData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: trainingData, error } = await supabase
        .from('ai_training_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      setData(trainingData || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
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
              className="flex justify-between items-center p-3 border border-neutral-800 rounded-md bg-neutral-900/50 hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center flex-1 min-w-0">
                {getFileIcon(item.data_type, item.file_name)}
                <div className="ml-3 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.title}</p>
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
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
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
