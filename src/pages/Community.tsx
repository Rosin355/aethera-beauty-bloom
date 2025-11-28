import { useState } from "react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunityForum } from "@/components/Community/CommunityForum";
import { ProfessionalNetwork } from "@/components/Community/ProfessionalNetwork";
import { JobBoard } from "@/components/Community/JobBoard";
import { ProfileSetup } from "@/components/Community/ProfileSetup";
import { SectionGuide } from "@/components/Community/SectionGuide";
import { Users, MessageSquare, Briefcase, User } from "lucide-react";

const sectionDescriptions = {
  forum: {
    title: "Come funziona il Forum",
    description: "Il forum è il cuore della nostra community. Qui puoi condividere esperienze, chiedere consigli e partecipare a discussioni con altri professionisti del settore beauty.",
    tips: [
      "Scegli la categoria più adatta per il tuo post (Business, Consigli Tecnici, Eventi, ecc.)",
      "Usa un titolo chiaro e descrittivo per attirare l'attenzione",
      "Rispetta gli altri membri e mantieni un tono professionale",
      "I post sono organizzati per categoria: Business per strategie aziendali, Consigli Tecnici per trattamenti, Eventi per formazioni"
    ]
  },
  network: {
    title: "Cos'è il Network Professionale",
    description: "Scopri e connettiti con altri professionisti del settore beauty. Visualizza i profili, le competenze e l'esperienza di titolari, dipendenti, studenti e freelance.",
    tips: [
      "Usa i filtri per trovare professionisti nella tua zona o con competenze specifiche",
      "I badge colorati indicano il tipo di professionista (Titolare, Dipendente, Studente)",
      "Visita i profili per vedere le competenze dettagliate e i link social",
      "Contatta i professionisti tramite LinkedIn o i loro siti web"
    ]
  },
  jobs: {
    title: "Come usare la Bacheca Lavoro",
    description: "Trova opportunità di lavoro nel settore beauty o pubblica annunci per cercare collaboratori. La bacheca è aperta a titolari che cercano personale e a professionisti in cerca di impiego.",
    tips: [
      "Chi cerca lavoro: consulta gli annunci e candidati direttamente",
      "Chi offre lavoro: pubblica annunci dettagliati con competenze richieste e retribuzione",
      "Gli annunci sono moderati per garantire qualità e serietà",
      "Filtra per tipo di contratto: tempo pieno, part-time, freelance o stage"
    ]
  },
  profile: {
    title: "Perché completare il tuo Profilo",
    description: "Il tuo profilo professionale è la tua vetrina nella community. Completalo per farti trovare da altri professionisti, ricevere proposte di lavoro e aumentare la tua visibilità.",
    tips: [
      "Aggiungi una foto professionale per aumentare la fiducia",
      "Elenca le tue competenze specifiche (trattamenti viso, massaggi, ecc.)",
      "Carica il tuo CV se sei in cerca di opportunità lavorative",
      "Collega i tuoi profili social per facilitare i contatti"
    ]
  }
};

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
            <SectionGuide {...sectionDescriptions.forum} />
            <CommunityForum />
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <SectionGuide {...sectionDescriptions.network} />
            <ProfessionalNetwork />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <SectionGuide {...sectionDescriptions.jobs} />
            <JobBoard />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <SectionGuide {...sectionDescriptions.profile} />
            <ProfileSetup />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}