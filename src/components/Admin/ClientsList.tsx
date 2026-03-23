import { useState, useEffect } from "react";
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
import { Search, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Client {
  id: string;
  user_id: string;
  display_name: string;
  business_name: string | null;
  city: string | null;
  phone_number: string | null;
  user_type: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  email?: string;
}

const ClientsList = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUserType, setFilterUserType] = useState("all");
  const [filterOnboarding, setFilterOnboarding] = useState("all");
  
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        return;
      }

      setClients(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUserType = filterUserType === "all" || client.user_type === filterUserType;
    const matchesOnboarding = filterOnboarding === "all" || 
      (filterOnboarding === "completed" && client.onboarding_completed) ||
      (filterOnboarding === "pending" && !client.onboarding_completed);
    
    return matchesSearch && matchesUserType && matchesOnboarding;
  });
  
  const getUserTypeBadge = (userType: string | null) => {
    switch(userType) {
      case "professional":
        return <Badge className="bg-brand-fire">Professionista</Badge>;
      case "user":
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Utente</Badge>;
      default:
        return <Badge variant="outline">N/D</Badge>;
    }
  };
  
  const getOnboardingBadge = (completed: boolean | null) => {
    if (completed) {
      return <Badge className="bg-green-500">Completato</Badge>;
    }
    return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">In attesa</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Lista Clienti ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Cerca per nome, business o città..."
                className="pl-10 bg-neutral-800 border-neutral-700"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex space-x-2">
              <div className="w-40">
                <Select value={filterUserType} onValueChange={setFilterUserType}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue placeholder="Tipo utente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="professional">Professionista</SelectItem>
                    <SelectItem value="user">Utente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={filterOnboarding} onValueChange={setFilterOnboarding}>
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue placeholder="Onboarding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="completed">Completato</SelectItem>
                    <SelectItem value="pending">In attesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="border border-neutral-800 rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800 hover:bg-neutral-800/50">
                  <TableHead className="w-[250px] text-muted-foreground">Nome / Business</TableHead>
                  <TableHead className="text-muted-foreground">Città</TableHead>
                  <TableHead className="text-muted-foreground">Telefono</TableHead>
                  <TableHead className="text-muted-foreground">Tipo</TableHead>
                  <TableHead className="text-muted-foreground">Onboarding</TableHead>
                  <TableHead className="text-muted-foreground">Registrazione</TableHead>
                  <TableHead className="text-right text-muted-foreground">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <TableRow key={client.id} className="border-neutral-800 hover:bg-neutral-800/50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-foreground">{client.display_name}</div>
                          {client.business_name && (
                            <div className="text-sm text-muted-foreground">{client.business_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{client.city || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{client.phone_number || '-'}</TableCell>
                      <TableCell>{getUserTypeBadge(client.user_type)}</TableCell>
                      <TableCell>{getOnboardingBadge(client.onboarding_completed)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: it })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/admin/clients/${client.user_id}`}>
                          <Button variant="outline" size="sm" className="border-neutral-700 hover:bg-neutral-800">
                            Dettagli
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
