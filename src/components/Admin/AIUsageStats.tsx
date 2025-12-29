import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Bot, MessageSquare, Users, Clock, TrendingUp, Loader2 } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { it } from "date-fns/locale";

interface UsageLog {
  id: string;
  user_id: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  model: string;
  response_time_ms: number | null;
  created_at: string;
}

interface DailyStats {
  date: string;
  requests: number;
  tokens: number;
  avgResponseTime: number;
}

interface UserStats {
  user_id: string;
  display_name: string;
  requests: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--brand-water))', 'hsl(var(--brand-fire))', 'hsl(var(--brand-earth))', 'hsl(var(--brand-air))'];

export function AIUsageStats() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("7");
  const [totalConversations, setTotalConversations] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const daysAgo = parseInt(period);
      const startDate = startOfDay(subDays(new Date(), daysAgo)).toISOString();

      // Fetch usage logs
      const { data: usageLogs, error: logsError } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;
      setLogs(usageLogs || []);

      // Count total conversations
      const { count: convCount } = await supabase
        .from('ai_conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);
      
      setTotalConversations(convCount || 0);

      // Count active users
      const { data: uniqueUsers } = await supabase
        .from('ai_conversations')
        .select('user_id')
        .gte('created_at', startDate);
      
      const uniqueUserIds = new Set(uniqueUsers?.map(u => u.user_id));
      setActiveUsers(uniqueUserIds.size);

    } catch (error) {
      console.error('Error fetching AI stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate daily stats
  const dailyStats: DailyStats[] = (() => {
    const daysAgo = parseInt(period);
    const stats: Record<string, DailyStats> = {};
    
    for (let i = 0; i < daysAgo; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      stats[date] = { date, requests: 0, tokens: 0, avgResponseTime: 0 };
    }

    logs.forEach(log => {
      const date = format(new Date(log.created_at), 'yyyy-MM-dd');
      if (stats[date]) {
        stats[date].requests++;
        stats[date].tokens += (log.tokens_input || 0) + (log.tokens_output || 0);
        stats[date].avgResponseTime += log.response_time_ms || 0;
      }
    });

    return Object.values(stats)
      .map(s => ({
        ...s,
        avgResponseTime: s.requests > 0 ? Math.round(s.avgResponseTime / s.requests) : 0,
        date: format(new Date(s.date), 'dd MMM', { locale: it })
      }))
      .reverse();
  })();

  // Calculate totals
  const totalRequests = logs.length;
  const totalTokens = logs.reduce((sum, log) => sum + (log.tokens_input || 0) + (log.tokens_output || 0), 0);
  const avgResponseTime = logs.length > 0 
    ? Math.round(logs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logs.length)
    : 0;

  // Model distribution
  const modelDistribution = (() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      const model = log.model || 'unknown';
      counts[model] = (counts[model] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Statistiche AI</h2>
          <p className="text-sm text-neutral-400">Monitora l'utilizzo dell'assistente AI</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40 bg-neutral-800 border-neutral-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Ultimi 7 giorni</SelectItem>
            <SelectItem value="14">Ultimi 14 giorni</SelectItem>
            <SelectItem value="30">Ultimi 30 giorni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalRequests}</p>
                <p className="text-xs text-neutral-400">Richieste AI</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-water/10">
                <Bot className="h-5 w-5 text-brand-water" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalConversations}</p>
                <p className="text-xs text-neutral-400">Conversazioni</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-fire/10">
                <Users className="h-5 w-5 text-brand-fire" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeUsers}</p>
                <p className="text-xs text-neutral-400">Utenti attivi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-earth/10">
                <Clock className="h-5 w-5 text-brand-earth" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{avgResponseTime}ms</p>
                <p className="text-xs text-neutral-400">Tempo medio risposta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests over time */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Richieste nel tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response time trend */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Tempo di risposta medio (ms)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgResponseTime" 
                  stroke="hsl(var(--brand-water))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--brand-water))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model distribution */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Distribuzione modelli</CardTitle>
          </CardHeader>
          <CardContent>
            {modelDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={modelDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name.split('/').pop()} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {modelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-neutral-400">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token usage */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white text-base">Token utilizzati</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="tokens" fill="hsl(var(--brand-fire))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Total tokens summary */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-neutral-400">Token totali utilizzati nel periodo:</span>
            <span className="text-xl font-bold text-white">{totalTokens.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
