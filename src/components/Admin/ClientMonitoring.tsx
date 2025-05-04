
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Phone, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

// Dati di esempio
const topPerformers = [
  {
    id: "1",
    name: "Francesca Neri",
    businessName: "Beauty Center Napoli",
    revenue: 5670,
    growth: 12,
    trainingProgress: 85,
    engagement: 95
  },
  {
    id: "4",
    name: "Maria Rossi",
    businessName: "Beauty Spa Milano",
    revenue: 4850,
    growth: 8,
    trainingProgress: 92,
    engagement: 87
  },
  {
    id: "5",
    name: "Roberto Russo",
    businessName: "Hair Studio Firenze",
    revenue: 2980,
    growth: 15,
    trainingProgress: 78,
    engagement: 90
  }
];

const underperformers = [
  {
    id: "2",
    name: "Giulia Bianchi",
    businessName: "Estetica Giulia",
    revenue: 3200,
    growth: -5,
    trainingProgress: 45,
    engagement: 55,
    issue: "drop_revenue"
  },
  {
    id: "3",
    name: "Alessandro Verdi",
    businessName: "Barber Shop Roma",
    revenue: 1250,
    growth: -18,
    trainingProgress: 25,
    engagement: 30,
    issue: "low_engagement"
  },
  {
    id: "6",
    name: "Laura Ferrari",
    businessName: "Beauty Lab Torino",
    revenue: 1850,
    growth: -10,
    trainingProgress: 60,
    engagement: 40,
    issue: "missed_training"
  }
];

const ClientMonitoring = () => {
  const getIssueLabel = (issue: string) => {
    switch(issue) {
      case "drop_revenue":
        return <Badge className="bg-red-500">Calo Ricavi</Badge>;
      case "low_engagement":
        return <Badge className="bg-orange-500">Basso Engagement</Badge>;
      case "missed_training":
        return <Badge className="bg-yellow-500">Formazione Incompleta</Badge>;
      default:
        return <Badge variant="outline">Altro</Badge>;
    }
  };
  
  const getGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return <span className="text-green-600 flex items-center"><ArrowUp className="h-3.5 w-3.5 mr-1" />{growth}%</span>;
    } else if (growth < 0) {
      return <span className="text-red-600 flex items-center"><ArrowDown className="h-3.5 w-3.5 mr-1" />{Math.abs(growth)}%</span>;
    }
    return <span className="text-gray-500">0%</span>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Top Performers</CardTitle>
            <CardDescription>Clienti con le migliori performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((client) => (
                <div key={client.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium">{client.name}</h4>
                      <p className="text-sm text-gray-500">{client.businessName}</p>
                    </div>
                    <Link to={`/admin/clients/${client.id}`}>
                      <Button variant="outline" size="sm">Dettagli</Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Ricavi</p>
                      <div className="flex items-center mt-1">
                        <span className="font-medium">€{client.revenue}</span>
                        <span className="ml-2">{getGrowthIndicator(client.growth)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Formazione</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={client.trainingProgress} className="h-2" />
                        <span className="text-sm font-medium">{client.trainingProgress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Engagement</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={client.engagement} className="h-2" />
                        <span className="text-sm font-medium">{client.engagement}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Underperforming Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Clienti in Difficoltà</CardTitle>
            <CardDescription>Clienti che potrebbero aver bisogno di supporto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {underperformers.map((client) => (
                <div key={client.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium">{client.name}</h4>
                        <div className="ml-2">
                          {getIssueLabel(client.issue)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">{client.businessName}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        <span className="text-xs">Pianifica</span>
                      </Button>
                      <Link to={`/admin/clients/${client.id}`}>
                        <Button size="sm" variant="outline">Dettagli</Button>
                      </Link>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Ricavi</p>
                      <div className="flex items-center mt-1">
                        <span className="font-medium">€{client.revenue}</span>
                        <span className="ml-2">{getGrowthIndicator(client.growth)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Formazione</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={client.trainingProgress} className="h-2" />
                        <span className="text-sm font-medium">{client.trainingProgress}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Engagement</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={client.engagement} className="h-2" />
                        <span className="text-sm font-medium">{client.engagement}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Attività Recenti</CardTitle>
          <CardDescription>Ultime attività e azioni intraprese</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Attività</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Alessandro Verdi</TableCell>
                <TableCell>Chiamata di supporto pianificata</TableCell>
                <TableCell>15/09/2023</TableCell>
                <TableCell>
                  <Badge>Completata</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">Visualizza</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Giulia Bianchi</TableCell>
                <TableCell>Email di re-engagement inviata</TableCell>
                <TableCell>12/09/2023</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                    In attesa
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">Visualizza</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Laura Ferrari</TableCell>
                <TableCell>Promemoria corso formativo</TableCell>
                <TableCell>10/09/2023</TableCell>
                <TableCell>
                  <Badge className="bg-green-500">Completata</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">Visualizza</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientMonitoring;
