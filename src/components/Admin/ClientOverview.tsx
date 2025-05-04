
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

// Dati di esempio per i grafici
const revenueData = [
  { month: "Gen", revenue: 1200 },
  { month: "Feb", revenue: 1500 },
  { month: "Mar", revenue: 1100 },
  { month: "Apr", revenue: 1700 },
  { month: "Mag", revenue: 1400 },
  { month: "Giu", revenue: 2100 },
  { month: "Lug", revenue: 1900 },
  { month: "Ago", revenue: 2300 },
  { month: "Set", revenue: 1800 }
];

const serviceData = [
  { name: "Trattamenti Viso", value: 35 },
  { name: "Massaggi", value: 25 },
  { name: "Manicure", value: 20 },
  { name: "Trattamenti Corpo", value: 15 },
  { name: "Altri", value: 5 }
];

interface ClientOverviewProps {
  clientId: string | undefined;
}

const ClientOverview = ({ clientId }: ClientOverviewProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Andamento Ricavi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
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
                      72
                    </div>
                    <div className="ml-4">
                      <span className="text-sm font-medium">Buono</span>
                      <p className="text-xs text-gray-500">+5 punti nell'ultimo mese</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Numero di Sessioni</h4>
                  <p className="text-2xl font-semibold mt-1">48</p>
                  <p className="text-xs text-gray-500">Ultimo accesso: 2 giorni fa</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Risorse Completate</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Video Tutorial</span>
                    <span className="font-medium">8/12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Corsi</span>
                    <span className="font-medium">2/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Webinar</span>
                    <span className="font-medium">3/4</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientOverview;
