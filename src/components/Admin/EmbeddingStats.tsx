import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Zap, FileText, Search, TrendingUp, Loader2 } from "lucide-react";

interface Stats {
  totalDocuments: number;
  documentsWithEmbedding: number;
  documentsWithoutEmbedding: number;
  coveragePercentage: number;
  activeDocuments: number;
  totalSearches: number;
  avgResponseTime: number;
}

const EmbeddingStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch training data stats
      const { data: trainingData, error: trainingError } = await supabase
        .from('ai_training_data')
        .select('id, embedding, is_active');

      if (trainingError) {
        console.error('Error fetching training data:', trainingError);
        return;
      }

      const total = trainingData?.length || 0;
      const withEmbedding = trainingData?.filter(d => d.embedding !== null).length || 0;
      const active = trainingData?.filter(d => d.is_active).length || 0;

      // Fetch AI usage logs for search stats
      const { data: usageLogs, error: usageError } = await supabase
        .from('ai_usage_logs')
        .select('id, response_time_ms')
        .order('created_at', { ascending: false })
        .limit(100);

      let totalSearches = 0;
      let avgResponseTime = 0;

      if (!usageError && usageLogs) {
        totalSearches = usageLogs.length;
        const validTimes = usageLogs.filter(l => l.response_time_ms !== null);
        if (validTimes.length > 0) {
          avgResponseTime = Math.round(
            validTimes.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / validTimes.length
          );
        }
      }

      setStats({
        totalDocuments: total,
        documentsWithEmbedding: withEmbedding,
        documentsWithoutEmbedding: total - withEmbedding,
        coveragePercentage: total > 0 ? Math.round((withEmbedding / total) * 100) : 0,
        activeDocuments: active,
        totalSearches,
        avgResponseTime,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="bg-neutral-900 border-neutral-800 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5 text-brand-water" />
          Statistiche Ricerca Semantica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FileText className="h-4 w-4" />
              Documenti Totali
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.totalDocuments}</p>
          </div>
          
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Zap className="h-4 w-4 text-green-500" />
              Con Embedding
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.documentsWithEmbedding}</p>
          </div>
          
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4 text-brand-water" />
              Ricerche AI
            </div>
            <p className="text-2xl font-bold text-brand-water">{stats.totalSearches}</p>
          </div>
          
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Search className="h-4 w-4 text-brand-fire" />
              Tempo Medio
            </div>
            <p className="text-2xl font-bold text-brand-fire">
              {stats.avgResponseTime > 0 ? `${stats.avgResponseTime}ms` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Copertura Embedding</span>
              <span className="text-sm font-medium text-foreground">{stats.coveragePercentage}%</span>
            </div>
            <Progress 
              value={stats.coveragePercentage} 
              className="h-2 bg-neutral-800"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.documentsWithEmbedding} di {stats.totalDocuments} documenti indicizzati
            </p>
          </div>

          {stats.documentsWithoutEmbedding > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-sm text-amber-500">
                ⚠️ {stats.documentsWithoutEmbedding} documenti non hanno embedding. 
                Usa "Indicizza tutti" per abilitare la ricerca semantica su tutti i contenuti.
              </p>
            </div>
          )}

          {stats.coveragePercentage === 100 && stats.totalDocuments > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-sm text-green-500">
                ✓ Tutti i documenti sono indicizzati! La ricerca semantica è completamente operativa.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmbeddingStats;
