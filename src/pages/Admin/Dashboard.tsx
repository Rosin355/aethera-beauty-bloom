
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/Admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ClientsList from "@/components/Admin/ClientsList";
import ContentManagement from "@/components/Admin/ContentManagement";
import AIDataTools from "@/components/Admin/AIDataTools";
import { AIUsageStats } from "@/components/Admin/AIUsageStats";
import ClientMonitoring from "@/components/Admin/ClientMonitoring";
import { CommunityModeration } from "@/components/Admin/CommunityModeration";
import { CommunityStats } from "@/components/Admin/CommunityStats";
import CollaboratorManagement from "@/components/Admin/CollaboratorManagement";
import { Users, FileText, MessageSquare, BarChart3, Database, Activity, UserCog, Bot } from "lucide-react";

const AdminDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "clients";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };
  
  return (
    <AdminLayout>
      <Helmet>
        <title>Area Amministrazione | 4 elementi Italia</title>
      </Helmet>
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-brand-earth to-brand-earth/70 text-white border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-playfair">
              Pannello di Amministrazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/90">
              Gestisci i tuoi clienti, contenuti e monitora le performance.
            </p>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-8 mb-8 bg-neutral-900 border border-neutral-800">
            <TabsTrigger value="clients" className="flex items-center gap-2 data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Clienti</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              <span className="hidden lg:inline">Contenuti</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2 data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden lg:inline">Statistiche</span>
            </TabsTrigger>
            <TabsTrigger value="aidata" className="flex items-center gap-2 data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <Database className="h-4 w-4" />
              <span className="hidden lg:inline">Dati AI</span>
            </TabsTrigger>
            <TabsTrigger value="aistats" className="flex items-center gap-2 data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <Bot className="h-4 w-4" />
              <span className="hidden lg:inline">AI Stats</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2 data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <Activity className="h-4 w-4" />
              <span className="hidden lg:inline">Monitoraggio</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <UserCog className="h-4 w-4" />
              <span className="hidden lg:inline">Utenti</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients" className="space-y-4">
            <ClientsList />
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <ContentManagement />
          </TabsContent>
          
          <TabsContent value="community" className="space-y-4">
            <CommunityModeration />
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4">
            <CommunityStats />
          </TabsContent>
          
          <TabsContent value="aidata" className="space-y-4">
            <AIDataTools />
          </TabsContent>
          
          <TabsContent value="aistats" className="space-y-4">
            <AIUsageStats />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <ClientMonitoring />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Gestione Utenti e Ruoli</CardTitle>
                <CardDescription className="text-neutral-400">
                  Gestisci utenti, assegna ruoli admin e collaboratori
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CollaboratorManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
