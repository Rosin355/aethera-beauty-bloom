
import { useState } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppointmentScheduler from "@/components/Management/AppointmentScheduler";
import InventoryManager from "@/components/Management/InventoryManager";
import ServiceCatalog from "@/components/Management/ServiceCatalog";
import OverviewPanel from "@/components/Management/OverviewPanel";
import CenterMembersCard from "@/components/Management/CenterMembersCard";
import CategorySettings from "@/components/Management/CategorySettings";
import { useCenter } from "@/contexts/CenterContext";

const ManagementTools = () => {
  const [activeTab, setActiveTab] = useState("appointments");
  const { role } = useCenter();
  const isOwner = role === "owner";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="glass-card rounded-[28px] border-white/10 text-white">
          <CardHeader>
            <p className="eyebrow mb-2">Gestionale</p>
            <CardTitle className="text-2xl font-playfair">
              Strumenti di Gestione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Organizza le operazioni del tuo business in modo efficiente con questi strumenti di gestione.
            </p>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid ${isOwner ? "grid-cols-6" : "grid-cols-4"} mb-8`}>
            <TabsTrigger value="appointments">Appuntamenti</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="services">Servizi</TabsTrigger>
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            {isOwner && <TabsTrigger value="team">Team</TabsTrigger>}
            {isOwner && <TabsTrigger value="settings">Impostazioni</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="appointments" className="space-y-4">
            <AppointmentScheduler />
          </TabsContent>
          
          <TabsContent value="inventory" className="space-y-4">
            <InventoryManager />
          </TabsContent>
          
          <TabsContent value="services" className="space-y-4">
            <ServiceCatalog />
          </TabsContent>
          
          <TabsContent value="overview" className="space-y-4">
            <OverviewPanel />
          </TabsContent>

          {isOwner && (
            <TabsContent value="team" className="space-y-4">
              <CenterMembersCard />
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="settings" className="space-y-4">
              <CategorySettings />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManagementTools;
