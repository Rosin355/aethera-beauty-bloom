
import { useState } from "react";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/Admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ClientsList from "@/components/Admin/ClientsList";
import ContentManagement from "@/components/Admin/ContentManagement";
import AIDataTools from "@/components/Admin/AIDataTools";
import ClientMonitoring from "@/components/Admin/ClientMonitoring";
import { CommunityModeration } from "@/components/Admin/CommunityModeration";
import { CommunityStats } from "@/components/Admin/CommunityStats";
import CollaboratorManagement from "@/components/Admin/CollaboratorManagement";
import { Users, FileText, MessageSquare, BarChart3, Database, Activity, UserCog } from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("clients");
  
  return (
    <AdminLayout>
      <Helmet>
        <title>Area Amministrazione | 4 elementi Italia</title>
      </Helmet>
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-brand-earth to-brand-earth/70 text-white">
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-7 mb-8">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clienti
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contenuti
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistiche
            </TabsTrigger>
            <TabsTrigger value="aidata" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Dati AI
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Monitoraggio
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Utenti
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
          
          <TabsContent value="monitoring" className="space-y-4">
            <ClientMonitoring />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestione Utenti e Ruoli</CardTitle>
                <CardDescription>
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
