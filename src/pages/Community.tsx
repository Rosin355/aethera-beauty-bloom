import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunityForum } from "@/components/Community/CommunityForum";
import { ProfessionalNetwork } from "@/components/Community/ProfessionalNetwork";
import { JobBoard } from "@/components/Community/JobBoard";
import { ProfileSetup } from "@/components/Community/ProfileSetup";
import { SectionGuide } from "@/components/Community/SectionGuide";
import { GuidedTour, useCommunityTour } from "@/components/Community/GuidedTour";
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

const tabVariants = {
  initial: { 
    opacity: 0, 
    y: 10,
    scale: 0.98
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1]
    }
  }
};

export default function Community() {
  const [activeTab, setActiveTab] = useState("forum");
  const { showTour, completeTour, skipTour } = useCommunityTour();

  const renderTabContent = () => {
    switch (activeTab) {
      case "forum":
        return (
          <motion.div
            key="forum"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            <SectionGuide {...sectionDescriptions.forum} />
            <CommunityForum />
          </motion.div>
        );
      case "network":
        return (
          <motion.div
            key="network"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            <SectionGuide {...sectionDescriptions.network} />
            <ProfessionalNetwork />
          </motion.div>
        );
      case "jobs":
        return (
          <motion.div
            key="jobs"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            <SectionGuide {...sectionDescriptions.jobs} />
            <JobBoard />
          </motion.div>
        );
      case "profile":
        return (
          <motion.div
            key="profile"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4 sm:space-y-6"
          >
            <SectionGuide {...sectionDescriptions.profile} />
            <ProfileSetup />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      {showTour && <GuidedTour onComplete={completeTour} onSkip={skipTour} />}
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Community</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Connettiti con professionisti del settore, condividi esperienze e trova nuove opportunità
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="forum" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Forum</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Network</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <Briefcase className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Lavoro</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Profilo</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <AnimatePresence mode="wait">
              {renderTabContent()}
            </AnimatePresence>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
