
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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

// Dati di esempio per i grafici
const performanceTrendData = [
  { month: "Gen", revenue: 1200, clients: 25, services: 48 },
  { month: "Feb", revenue: 1500, clients: 28, services: 52 },
  { month: "Mar", revenue: 1100, clients: 22, services: 45 },
  { month: "Apr", revenue: 1700, clients: 30, services: 58 },
  { month: "Mag", revenue: 1400, clients: 26, services: 50 },
  { month: "Giu", revenue: 2100, clients: 35, services: 65 },
  { month: "Lug", revenue: 1900, clients: 33, services: 62 },
  { month: "Ago", revenue: 2300, clients: 38, services: 70 },
  { month: "Set", revenue: 1800, clients: 32, services: 60 }
];

const retentionData = [
  { name: "Clienti Ripetuti", value: 68 },
  { name: "Nuovi Clienti", value: 32 }
];

const COLORS = ["#6AA8B3", "#E46A39"];

interface ClientPerformanceProps {
  clientId: string | undefined;
}

const ClientPerformance = ({ clientId }: ClientPerformanceProps) => {
  // KPI di esempio
  const kpis = [
    {
      label: "Ricavi Mensili",
      value: "€1,840",
      change: "+8%",
      trend: "up"
    },
    {
      label: "Clienti Attivi",
      value: "32",
      change: "+12%",
      trend: "up"
    },
    {
      label: "Prenotazioni",
      value: "58",
      change: "-3%",
      trend: "down"
    },
    {
      label: "Tasso di Conversione",
      value: "24%",
      change: "+5%",
      trend: "up"
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-semibold">{kpi.value}</span>
                <Badge 
                  className={kpi.trend === "up" ? "bg-green-500" : "bg-red-500"}
                >
                  {kpi.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Andamento Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceTrendData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Ricavi (€)" 
                  stroke="#E46A39" 
                  fill="#E46A39" 
                  fillOpacity={0.3} 
                />
                <Area 
                  type="monotone" 
                  dataKey="clients" 
                  name="Clienti" 
                  stroke="#6AA8B3" 
                  fill="#6AA8B3" 
                  fillOpacity={0.3} 
                />
                <Area 
                  type="monotone" 
                  dataKey="services" 
                  name="Servizi" 
                  stroke="#C2977E" 
                  fill="#C2977E" 
                  fillOpacity={0.3} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Fidelizzazione Clienti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
            </div>
          </CardContent>
        </Card>
        
        {/* Training Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Progresso Formazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Corso Base Beauty Business</span>
                  <span className="text-sm font-medium">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Strategie di Marketing Digitale</span>
                  <span className="text-sm font-medium">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Tecniche Avanzate di Vendita</span>
                  <span className="text-sm font-medium">50%</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Gestione del Team</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Analisi Finanziaria</span>
                  <span className="text-sm font-medium">0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientPerformance;
