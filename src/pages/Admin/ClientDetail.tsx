
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/Admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import ClientOverview from "@/components/Admin/ClientOverview";
import ClientPerformance from "@/components/Admin/ClientPerformance";
import ClientNotes from "@/components/Admin/ClientNotes";

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulazione caricamento dati client
    setTimeout(() => {
      setClient({
        id,
        name: "Maria Rossi",
        email: "maria.rossi@example.com",
        businessName: "Beauty Spa Milano",
        signupDate: "2023-05-15",
        totalRevenue: 4850,
        courseProgress: 68,
        clientCount: 42
      });
      setIsLoading(false);
    }, 800);
  }, [id]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-earth"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>Dettaglio Cliente | 4 elementi Italia</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-playfair">{client.name}</h1>
          </div>
          
          <Button className="bg-brand-fire hover:bg-brand-fire/90">
            Pianifica Chiamata di Supporto
          </Button>
        </div>
        
        <Card className="bg-white">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-xl">
              {client.businessName}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Ricavi Totali</div>
                <div className="text-2xl font-medium">€{client.totalRevenue}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Progresso Corsi</div>
                <div className="text-2xl font-medium">{client.courseProgress}%</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Clienti Totali</div>
                <div className="text-2xl font-medium">{client.clientCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="notes">Note Interne</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <ClientOverview clientId={id} />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <ClientPerformance clientId={id} />
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-4">
            <ClientNotes clientId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ClientDetail;
