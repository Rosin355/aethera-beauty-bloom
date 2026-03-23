import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, TrendingUp, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackData {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  satisfactionRate: number;
  recentFeedback: Array<{
    id: string;
    rating: string;
    created_at: string;
  }>;
}

export function FeedbackStats() {
  const [data, setData] = useState<FeedbackData>({
    totalFeedback: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    satisfactionRate: 0,
    recentFeedback: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all feedback
        const { data: feedback, error } = await supabase
          .from('ai_feedback')
          .select('id, rating, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const allFeedback = feedback || [];
        const positive = allFeedback.filter(f => f.rating === 'positive').length;
        const negative = allFeedback.filter(f => f.rating === 'negative').length;
        const total = allFeedback.length;

        setData({
          totalFeedback: total,
          positiveFeedback: positive,
          negativeFeedback: negative,
          satisfactionRate: total > 0 ? Math.round((positive / total) * 100) : 0,
          recentFeedback: allFeedback.slice(0, 5),
        });
      } catch (error) {
        console.error('Error fetching feedback stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Utenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback Risposte AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
            <ThumbsUp className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{data.positiveFeedback}</p>
              <p className="text-xs text-muted-foreground">Positivi</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
            <ThumbsDown className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{data.negativeFeedback}</p>
              <p className="text-xs text-muted-foreground">Negativi</p>
            </div>
          </div>
        </div>

        {/* Satisfaction Rate */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tasso di Soddisfazione
            </span>
            <span className="text-lg font-bold">{data.satisfactionRate}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${data.satisfactionRate}%` }}
            />
          </div>
        </div>

        {/* Total */}
        <div className="text-center text-sm text-muted-foreground">
          Totale feedback: <span className="font-medium">{data.totalFeedback}</span>
        </div>
      </CardContent>
    </Card>
  );
}
