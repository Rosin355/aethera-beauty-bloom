
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  ChevronDown, 
  ChevronUp, 
  Search,
  ArrowUpDown
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Dati di esempio
const dummyClients = [
  { 
    id: "1", 
    name: "Maria Rossi", 
    businessName: "Beauty Spa Milano", 
    email: "maria@beautyspa.it",
    phone: "+39 333 1234567",
    signupDate: "15/05/2023",
    status: "active",
    revenue: 4850,
    performance: "high"
  },
  { 
    id: "2", 
    name: "Giulia Bianchi", 
    businessName: "Estetica Giulia", 
    email: "giulia@esteticagiulia.it",
    phone: "+39 333 7654321",
    signupDate: "22/06/2023",
    status: "active",
    revenue: 3200,
    performance: "medium"
  },
  { 
    id: "3", 
    name: "Alessandro Verdi", 
    businessName: "Barber Shop Roma", 
    email: "alessandro@barbershop.it",
    phone: "+39 333 9876543",
    signupDate: "10/03/2023",
    status: "inactive",
    revenue: 1250,
    performance: "low"
  },
  { 
    id: "4", 
    name: "Francesca Neri", 
    businessName: "Beauty Center Napoli", 
    email: "francesca@beautycenter.it",
    phone: "+39 333 5678901",
    signupDate: "05/07/2023",
    status: "active",
    revenue: 5670,
    performance: "high"
  },
  { 
    id: "5", 
    name: "Roberto Russo", 
    businessName: "Hair Studio Firenze", 
    email: "roberto@hairstudio.it",
    phone: "+39 333 1122334",
    signupDate: "18/04/2023",
    status: "active",
    revenue: 2980,
    performance: "medium"
  }
];

const ClientsList = () => {
  const [clients, setClients] = useState(dummyClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPerformance, setFilterPerformance] = useState("all");
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || client.status === filterStatus;
    const matchesPerformance = filterPerformance === "all" || client.performance === filterPerformance;
    
    return matchesSearch && matchesStatus && matchesPerformance;
  });
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active":
        return <Badge className="bg-green-500">Attivo</Badge>;
      case "inactive":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Inattivo</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };
  
  const getPerformanceBadge = (performance: string) => {
    switch(performance) {
      case "high":
        return <Badge className="bg-brand-fire">Alta</Badge>;
      case "medium":
        return <Badge className="bg-brand-water">Media</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Bassa</Badge>;
      default:
        return <Badge variant="outline">N/D</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Lista Clienti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Cerca per nome, business o email..."
                className="pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex space-x-2">
              <div className="w-40">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="inactive">Inattivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={filterPerformance} onValueChange={setFilterPerformance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Bassa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Nome / Business</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registrazione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Ricavi</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.businessName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.signupDate}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>€{client.revenue.toLocaleString()}</TableCell>
                      <TableCell>{getPerformanceBadge(client.performance)}</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/clients/${client.id}`}>
                          <Button variant="outline" size="sm">Dettagli</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nessun cliente trovato
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsList;
