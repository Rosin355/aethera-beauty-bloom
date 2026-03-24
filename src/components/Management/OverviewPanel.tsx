
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartPie, Calendar, ShoppingBag } from "lucide-react";
import { fetchOverviewData, type OverviewKpis, type OverviewSeries } from "@/lib/api/management";
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

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setIsLoading(true);
        const data = await fetchOverviewData();
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
  }, []);

  const totalRevenue = kpis.revenue;
  const hasAnyData = kpis.totalBookings > 0 || kpis.productsTracked > 0 || series.topServices.length > 0;

  const COLORS = ["#6AA8B3", "#E46A39", "#C2977E", "#CBD8D4", "#1B1B1B"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold">{kpis.totalBookings}</div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Ultimi 7 giorni</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <ChartPie className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€{kpis.revenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Ricavi appuntamenti</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
            <ShoppingBag className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis.productsTracked}</div>
            <p className="text-xs text-gray-500 mt-1">Prodotti in inventario</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Avg. Service Value</CardTitle>
            <ChartPie className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€{kpis.avgServiceValue.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Valore medio servizio</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Weekly Bookings</CardTitle>
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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#6AA8B3" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Nessun appuntamento disponibile
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Product Usage by Category</CardTitle>
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {series.productUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Nessun dato inventario disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Top Performing Services</CardTitle>
        </CardHeader>
        <CardContent>
          {series.topServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {series.topServices.map((service, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{service.name}</h3>
                      <Badge variant="outline" className="bg-brand-cream text-brand-black">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bookings:</span>
                        <span className="font-medium">{service.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Revenue:</span>
                        <span className="font-medium">€{service.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">% of total revenue</span>
                        <span className="text-brand-fire font-semibold">
                          {totalRevenue > 0 ? Math.round((service.revenue / totalRevenue) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">
              Nessun servizio con performance disponibile
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && !hasAnyData && (
        <div className="text-center text-sm text-gray-500">
          Nessun dato disponibile. Aggiungi servizi, prodotti e appuntamenti per visualizzare la panoramica.
        </div>
      )}
    </div>
  );
};

export default OverviewPanel;
