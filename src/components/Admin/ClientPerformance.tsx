import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { buildClientOverviewData, fetchClientMetricsHistory } from "@/lib/api/adminManagement";
import { toast } from "sonner";

const COLORS = ["#6AA8B3", "#E46A39"];

interface ClientPerformanceProps {
  clientId: string | undefined;
}

const ClientPerformance = ({ clientId }: ClientPerformanceProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [performanceTrendData, setPerformanceTrendData] = useState<Array<{
    month: string;
    revenue: number;
    clients: number;
    services: number;
  }>>([]);
  const [retentionData, setRetentionData] = useState<Array<{ name: string; value: number }>>([]);
  const [trainingProgress, setTrainingProgress] = useState<Array<{ name: string; value: number }>>([]);
  const [kpis, setKpis] = useState<Array<{ label: string; value: string; change: string; trend: "up" | "down" | "neutral" }>>([]);

  useEffect(() => {
    const loadPerformance = async () => {
      if (!clientId) return;
      try {
        setIsLoading(true);
        const metrics = await fetchClientMetricsHistory(clientId);
        const normalized = buildClientOverviewData(metrics);
        const latest = normalized.latest;
        const previous = metrics.length > 1 ? metrics[metrics.length - 2] : null;

        setPerformanceTrendData(
          normalized.revenueTrend.map((row) => ({
            month: row.month,
            revenue: row.revenue,
            clients: row.clients,
            services: row.services,
          })),
        );
        setTrainingProgress(normalized.trainingProgress);

        const returning = latest?.retention_returning ?? 0;
        const newClients = latest?.retention_new ?? 0;
        const retentionTotal = returning + newClients;
        setRetentionData(
          retentionTotal > 0
            ? [
                { name: "Clienti Ripetuti", value: Math.round((returning / retentionTotal) * 100) },
                { name: "Nuovi Clienti", value: Math.round((newClients / retentionTotal) * 100) },
              ]
            : [],
        );

        const revenueNow = Number(latest?.revenue ?? 0);
        const revenuePrev = Number(previous?.revenue ?? 0);
        const clientsNow = latest?.active_clients ?? 0;
        const clientsPrev = previous?.active_clients ?? 0;
        const bookingsNow = latest?.bookings_count ?? 0;
        const bookingsPrev = previous?.bookings_count ?? 0;
        const convNow = Number(latest?.conversion_rate ?? 0);
        const convPrev = Number(previous?.conversion_rate ?? 0);

        const delta = (current: number, prev: number) => {
          if (prev === 0 && current === 0) return { text: "0%", trend: "neutral" as const };
          if (prev === 0 && current > 0) return { text: "+100%", trend: "up" as const };
          const value = ((current - prev) / Math.abs(prev)) * 100;
          return { text: `${value >= 0 ? "+" : ""}${Math.round(value)}%`, trend: value >= 0 ? "up" as const : "down" as const };
        };

        const revDelta = delta(revenueNow, revenuePrev);
        const cliDelta = delta(clientsNow, clientsPrev);
        const bookDelta = delta(bookingsNow, bookingsPrev);
        const convDelta = delta(convNow, convPrev);

        setKpis([
          { label: "Ricavi Mensili", value: `€${revenueNow.toFixed(0)}`, change: revDelta.text, trend: revDelta.trend },
          { label: "Clienti Attivi", value: `${clientsNow}`, change: cliDelta.text, trend: cliDelta.trend },
          { label: "Prenotazioni", value: `${bookingsNow}`, change: bookDelta.text, trend: bookDelta.trend },
          { label: "Tasso di Conversione", value: `${convNow.toFixed(1)}%`, change: convDelta.text, trend: convDelta.trend },
        ]);
      } catch (error) {
        console.error("Error loading client performance:", error);
        toast.error("Errore nel caricamento performance cliente");
      } finally {
        setIsLoading(false);
      }
    };
    loadPerformance();
  }, [clientId]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.length > 0 ? (
          kpis.map((kpi, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-2xl font-semibold">{kpi.value}</span>
                  <Badge className={kpi.trend === "up" ? "bg-green-500" : kpi.trend === "down" ? "bg-red-500" : "bg-gray-500"}>
                    {kpi.change}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center text-sm text-gray-500">
              {isLoading ? "Caricamento KPI..." : "Nessuna metrica KPI disponibile"}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Andamento Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {performanceTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={performanceTrendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Ricavi (€)" stroke="#E46A39" fill="#E46A39" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="clients" name="Clienti" stroke="#6AA8B3" fill="#6AA8B3" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="services" name="Servizi" stroke="#C2977E" fill="#C2977E" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                {isLoading ? "Caricamento andamento..." : "Nessuna serie storica disponibile"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Fidelizzazione Clienti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {retentionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={retentionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {retentionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Nessun dato fidelizzazione disponibile
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Progresso Formazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{trainingProgress[idx]?.name ?? "Nessun corso"}</span>
                    <span className="text-sm font-medium">{trainingProgress[idx] ? `${trainingProgress[idx].value}%` : "0%"}</span>
                  </div>
                  <Progress value={trainingProgress[idx]?.value ?? 0} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {!isLoading && performanceTrendData.length === 0 && (
        <div className="text-center text-sm text-gray-500">
          Nessuna metrica disponibile per mostrare la performance.
        </div>
      )}
    </div>
  );
};

export default ClientPerformance;
