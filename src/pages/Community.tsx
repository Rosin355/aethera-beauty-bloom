import { useState } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunityForum } from "@/components/Community/CommunityForum";
import { ProfessionalNetwork } from "@/components/Community/ProfessionalNetwork";
import { JobBoard } from "@/components/Community/JobBoard";
import { ProfileSetup } from "@/components/Community/ProfileSetup";
import { Users, MessageSquare, Briefcase, User } from "lucide-react";

export default function Community() {
  const [activeTab, setActiveTab] = useState("forum");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Community</h1>
          <p className="text-muted-foreground">
            Connettiti con professionisti del settore, condividi esperienze e trova nuove opportunità
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="forum" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Forum
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Network
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Lavoro
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profilo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forum" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forum della Community</CardTitle>
                <CardDescription>
                  Partecipa alle discussioni, condividi esperienze e chiedi consigli
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommunityForum />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Professionale</CardTitle>
                <CardDescription>
                  Scopri professionisti del settore e amplia la tua rete
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfessionalNetwork />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bacheca Lavoro</CardTitle>
                <CardDescription>
                  Trova opportunità lavorative o pubblica annunci
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JobBoard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Il Tuo Profilo Professionale</CardTitle>
                <CardDescription>
                  Configura il tuo profilo per farti trovare dalla community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileSetup />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}