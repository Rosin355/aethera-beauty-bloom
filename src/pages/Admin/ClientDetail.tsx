import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import AdminLayout from "@/components/Admin/AdminLayout";
import ClientOverview from "@/components/Admin/ClientOverview";
import ClientPerformance from "@/components/Admin/ClientPerformance";
import ClientNotes from "@/components/Admin/ClientNotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchClientDetailSummary } from "@/lib/api/adminManagement";
import { toast } from "sonner";

type ProgressPoint = {
  value?: number | null;
};

type ClientDetailView = {
  id: string;
  name: string;
  email: string;
  businessName: string;
  signupDate: string;
  totalRevenue: number;
  courseProgress: number;
  clientCount: number;
};

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState<ClientDetailView | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClient = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const summary = await fetchClientDetailSummary(id);
        if (!summary.profile) {
          setClient(null);
          return;
        }

        const metric = summary.latestMetric;
        setClient({
          id: summary.profile.user_id,
          name: summary.profile.display_name,
          email: summary.profile.email,
          businessName: summary.profile.business_name || "Business non specificato",
          signupDate: summary.profile.created_at,
          totalRevenue: Number(metric?.revenue ?? 0),
          courseProgress:
            Array.isArray(metric?.training_progress) && metric.training_progress.length > 0
              ? Math.round(
                  metric.training_progress.reduce(
                    (sum: number, item: ProgressPoint) => sum + Number(item.value || 0),
                    0
                  ) / metric.training_progress.length
                )
              : 0,
          clientCount: metric?.active_clients ?? 0,
        });
      } catch (error) {
        console.error("Error loading client detail:", error);
        toast.error("Errore nel caricamento cliente");
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
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

  if (!client && !isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-16 text-muted-foreground">Cliente non trovato.</div>
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
            <h1 className="text-2xl font-playfair">{client?.name}</h1>
          </div>

          <Button className="bg-brand-fire hover:bg-brand-fire/90">
            Pianifica Chiamata di Supporto
          </Button>
        </div>

        <Card className="bg-white">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-xl">{client?.businessName}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Ricavi Totali</div>
                <div className="text-2xl font-medium">€{client?.totalRevenue}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Progresso Corsi</div>
                <div className="text-2xl font-medium">{client?.courseProgress}%</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Clienti Totali</div>
                <div className="text-2xl font-medium">{client?.clientCount}</div>
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

