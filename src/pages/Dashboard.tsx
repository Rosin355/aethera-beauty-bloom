
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import WelcomeCard from "@/components/Dashboard/WelcomeCard";
import StatCard from "@/components/Dashboard/StatCard";
import FeaturePreview from "@/components/Dashboard/FeaturePreview";
import { BookOpen, Calendar, Users, MessageSquare, ChartPie, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <WelcomeCard />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Clienti Totali" 
          value="124" 
          change={{ value: "12%", isPositive: true }} 
          icon={<Users size={24} className="text-white" />} 
        />
        <StatCard 
          title="Fatturato Mensile" 
          value="€8.250" 
          change={{ value: "8.2%", isPositive: true }} 
          icon={<ChartPie size={24} className="text-white" />} 
        />
        <StatCard 
          title="Corsi Completati" 
          value="7" 
          change={{ value: "2", isPositive: true }} 
          icon={<BookOpen size={24} className="text-white" />} 
        />
        <StatCard 
          title="Appuntamenti" 
          value="28" 
          change={{ value: "4%", isPositive: false }} 
          icon={<Calendar size={24} className="text-white" />} 
        />
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold font-playfair">
          Esplora le Funzionalità di 4 elementi Italia
        </h2>
        <Link to="/dashboard/personalized">
          <Button variant="outline" className="flex items-center gap-2 border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white">
            <Layout size={16} />
            <span>Visualizza Dashboard Personalizzata</span>
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeaturePreview 
          title="Formazione Online" 
          description="Accedi a corsi professionali, tutorial e ottieni certificati per migliorare le tue competenze." 
          icon={<BookOpen size={24} className="text-white" />}
          linkText="Sfoglia Corsi" 
          linkPath="/dashboard/training" 
        />
        <FeaturePreview 
          title="Strumenti di Gestione" 
          description="Organizza appuntamenti, traccia l'inventario e gestisci il tuo business in modo efficiente." 
          icon={<Calendar size={24} className="text-white" />}
          linkText="Apri Calendario" 
          linkPath="/dashboard/management" 
        />
        <FeaturePreview 
          title="Community Professionale" 
          description="Connettiti con altri professionisti, condividi esperienze e amplia la tua rete." 
          icon={<Users size={24} className="text-white" />}
          linkText="Partecipa alle Discussioni" 
          linkPath="/dashboard/community" 
        />
        <FeaturePreview 
          title="Assistente AI" 
          description="Ricevi consigli personalizzati su strategie di business e gestione dei trattamenti." 
          icon={<MessageSquare size={24} className="text-white" />}
          linkText="Inizia Conversazione" 
          linkPath="/dashboard/ai-assistant" 
        />
        <FeaturePreview 
          title="Dashboard Analitica" 
          description="Monitora KPI, vendite, margini e visualizza le tue performance mensili." 
          icon={<ChartPie size={24} className="text-white" />}
          linkText="Visualizza Report" 
          linkPath="/dashboard/analytics" 
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
