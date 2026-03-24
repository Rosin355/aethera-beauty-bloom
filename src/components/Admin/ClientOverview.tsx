
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { buildClientOverviewData, fetchClientMetricsHistory } from "@/lib/api/adminManagement";
import { toast } from "sonner";

interface ClientOverviewProps {
  clientId: string | undefined;
}

const ClientOverview = ({ clientId }: ClientOverviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [serviceData, setServiceData] = useState<Array<{ name: string; value: number }>>([]);
  const [details, setDetails] = useState({
    healthScore: 0,
    healthLabel: "N/D",
    healthDelta: "Nessuna variazione disponibile",
    sessionsCount: 0,
    lastAccess: "N/D",
    resources: [] as Array<{ name: string; value: number }>,
  });

  useEffect(() => {
    const loadOverview = async () => {
      if (!clientId) return;
      try {
        setIsLoading(true);
        const metrics = await fetchClientMetricsHistory(clientId);
        const normalized = buildClientOverviewData(metrics);
        setRevenueData(normalized.revenueTrend.map((row) => ({ month: row.month, revenue: row.revenue })));
        setServiceData(normalized.serviceDistribution);

        const latest = normalized.latest;
        const avgResourceValue = normalized.trainingProgress.length > 0
          ? normalized.trainingProgress.reduce((sum, r) => sum + Number(r.value || 0), 0) / normalized.trainingProgress.length
          : 0;
        setDetails({
          healthScore: latest?.business_health_score ?? 0,
          healthLabel: (latest?.business_health_score ?? 0) >= 70 ? "Buono" : (latest?.business_health_score ?? 0) > 0 ? "Da migliorare" : "N/D",
          healthDelta: "Calcolato da metriche reali",
          sessionsCount: latest?.sessions_count ?? 0,
          lastAccess: latest?.metric_date
            ? new Date(latest.metric_date).toLocaleDateString("it-IT")
            : "N/D",
          resources: normalized.trainingProgress,
        });
      } catch (error) {
        console.error("Error loading client overview:", error);
        toast.error("Errore nel caricamento panoramica cliente");
      } finally {
        setIsLoading(false);
      }
    };
    loadOverview();
  }, [clientId]);

  const hasData = revenueData.length > 0 || serviceData.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Andamento Ricavi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={revenueData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`€${value}`, "Ricavi"]} 
                    labelFormatter={(label) => `Mese: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#E46A39"
                    activeDot={{ r: 8 }}
                    name="Ricavi"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Nessun dato ricavi disponibile
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Servizi Più Venduti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {serviceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={serviceData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, "Percentuale"]} 
                    />
                    <Legend />
                    <Bar dataKey="value" name="Percentuale" fill="#6AA8B3" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Nessun servizio disponibile
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Dettagli Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Business Health Score</h4>
                  <div className="mt-1 flex items-center">
                    <div className="w-16 h-16 rounded-full bg-brand-water text-white flex items-center justify-center text-xl font-bold">
                      {details.healthScore}
                    </div>
                    <div className="ml-4">
                      <span className="text-sm font-medium">{details.healthLabel}</span>
                      <p className="text-xs text-gray-500">{details.healthDelta}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Numero di Sessioni</h4>
                  <p className="text-2xl font-semibold mt-1">{details.sessionsCount}</p>
                  <p className="text-xs text-gray-500">Ultimo accesso: {details.lastAccess}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Risorse Completate</h4>
                <div className="space-y-2">
                  {details.resources.length > 0 ? (
                    details.resources.map((resource, index) => (
                      <div key={`${resource.name}-${index}`} className="flex justify-between items-center">
                        <span className="text-sm">{resource.name}</span>
                        <span className="font-medium">{Number(resource.value || 0)}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Nessun progresso formazione disponibile</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isLoading && !hasData && (
        <div className="text-center text-sm text-gray-500">
          Nessuna metrica disponibile per questo cliente.
        </div>
      )}
    </div>
  );
};

export default ClientOverview;
