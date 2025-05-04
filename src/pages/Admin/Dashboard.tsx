
import { useState } from "react";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/Admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientsList from "@/components/Admin/ClientsList";
import ContentManagement from "@/components/Admin/ContentManagement";
import AIDataTools from "@/components/Admin/AIDataTools";
import ClientMonitoring from "@/components/Admin/ClientMonitoring";

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
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="clients">Clienti</TabsTrigger>
            <TabsTrigger value="content">Contenuti</TabsTrigger>
            <TabsTrigger value="aidata">Dati AI</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoraggio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients" className="space-y-4">
            <ClientsList />
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <ContentManagement />
          </TabsContent>
          
          <TabsContent value="aidata" className="space-y-4">
            <AIDataTools />
          </TabsContent>
          
          <TabsContent value="monitoring" className="space-y-4">
            <ClientMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
