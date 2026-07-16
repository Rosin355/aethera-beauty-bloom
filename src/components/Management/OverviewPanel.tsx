
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartPie, Calendar, ShoppingBag } from "lucide-react";
import { fetchOverviewData, type OverviewKpis, type OverviewSeries } from "@/lib/api/management";
import { useCenter } from "@/contexts/CenterContext";
import { toast } from "sonner";

const OverviewPanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<OverviewKpis>({
    totalBookings: 0,
    revenue: 0,
    productsTracked: 0,
    avgServiceValue: 0,
  });
  const [series, setSeries] = useState<OverviewSeries>({
    weeklyBookings: [],
    productUsage: [],
    topServices: [],
  });

  const { centerId } = useCenter();

  useEffect(() => {
    if (!centerId) return;
    const loadOverview = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOverviewData(centerId);
        setKpis(data.kpis);
        setSeries(data.series);
      } catch (error) {
        console.error("Error loading overview:", error);
        toast.error("Errore nel caricamento panoramica");
      } finally {
        setIsLoading(false);
      }
    };
    loadOverview();
  }, [centerId]);

  const totalRevenue = kpis.revenue;
  const hasAnyData = kpis.totalBookings > 0 || kpis.productsTracked > 0 || series.topServices.length > 0;

  // Palette icy monocromatica coerente con il design system.
  const COLORS = ["#bfeeff", "#8fd0e8", "#619fb8", "#3f7089", "#2a4a5c"];
  const AXIS_TICK = { fill: "rgba(255,255,255,0.55)", fontSize: 12 };
  const TOOLTIP_STYLE = {
    background: "#0a0a0a",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    color: "#fff",
  };

  const kpiCards = [
    { label: "Appuntamenti Totali", value: String(kpis.totalBookings), note: "Ultimi 7 giorni", Icon: Calendar },
    { label: "Fatturato", value: `€${kpis.revenue.toFixed(2)}`, note: "Ricavi appuntamenti", Icon: ChartPie },
    { label: "Prodotti Tracciati", value: String(kpis.productsTracked), note: "Prodotti in inventario", Icon: ShoppingBag },
    { label: "Valore Medio Servizio", value: `€${kpis.avgServiceValue.toFixed(2)}`, note: "Per appuntamento", Icon: ChartPie },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiCards.map(({ label, value, note, Icon }) => (
          <Card key={label} className="border-white/10 bg-white/[0.03]">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-[11px] uppercase tracking-[0.18em] text-white/45 font-medium">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-white/45" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Appuntamenti Settimanali</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {series.weeklyBookings.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={series.weeklyBookings}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} tickLine={{ stroke: "rgba(255,255,255,0.12)" }} />
                  <YAxis tick={AXIS_TICK} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} tickLine={{ stroke: "rgba(255,255,255,0.12)" }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
                  <Bar dataKey="bookings" fill="#bfeeff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Nessun appuntamento disponibile
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Prodotti per Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {series.productUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={series.productUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, x, y, textAnchor }) => (
                      <text x={x} y={y} textAnchor={textAnchor} fill="rgba(255,255,255,0.75)" fontSize={12}>
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    )}
                    outerRadius={80}
                    fill="#bfeeff"
                    dataKey="value"
                  >
                    {series.productUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.4)" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Nessun dato inventario disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Servizi più Performanti</CardTitle>
        </CardHeader>
        <CardContent>
          {series.topServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {series.topServices.map((service, index) => (
                <Card key={index} className="border-white/10 bg-white/[.02] transition-colors hover:border-ice/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{service.name}</h3>
                      <Badge variant="outline" className="bg-ice/10 text-ice border-ice/30">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prenotazioni:</span>
                        <span className="font-medium">{service.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fatturato:</span>
                        <span className="font-medium">€{service.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">% del fatturato totale</span>
                        <span className="text-ice font-semibold">
                          {totalRevenue > 0 ? Math.round((service.revenue / totalRevenue) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nessun servizio con performance disponibile
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && !hasAnyData && (
        <div className="text-center text-sm text-muted-foreground">
          Nessun dato disponibile. Aggiungi servizi, prodotti e appuntamenti per visualizzare la panoramica.
        </div>
      )}
    </div>
  );
};

export default OverviewPanel;
