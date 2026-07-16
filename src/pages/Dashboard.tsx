
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import WelcomeCard from "@/components/Dashboard/WelcomeCard";
import StatCard from "@/components/Dashboard/StatCard";
import FeaturePreview from "@/components/Dashboard/FeaturePreview";
import BecomeAdminButton from "@/components/Auth/BecomeAdminButton";
import { ChatAssistant } from "@/components/AI/ChatAssistant";
import { BookOpen, Calendar, Users, MessageSquare, ChartPie, Layout, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { isAdmin } = useAuth();
  
  return (
    <DashboardLayout>
      <WelcomeCard />
      <BecomeAdminButton />
      
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
      
      {/* Chart + agenda (stesso linguaggio del preview hero, valori demo statici) */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Incassi ultimi 7 giorni</p>
          <div className="mt-5 flex h-28 items-end gap-2">
            {[42, 58, 51, 70, 64, 82, 76].map((h, i) => (
              <div key={i} className="flex-1 overflow-hidden rounded-t-md bg-white/5">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-ice/40 to-ice"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Agenda di oggi</p>
          <div className="mt-4 space-y-3">
            {[
              { time: "09:00", service: "Pulizia viso", tag: "Cabina 1" },
              { time: "10:30", service: "Massaggio relax", tag: "Cabina 2" },
              { time: "12:00", service: "Manicure gel", tag: "Postazione A" },
              { time: "14:30", service: "Trattamento corpo", tag: "Cabina 1" },
            ].map((row) => (
              <div key={row.time} className="flex items-center gap-3">
                <span className="w-12 text-xs font-semibold text-ice">{row.time}</span>
                <span className="flex-1 truncate text-sm text-white/80">{row.service}</span>
                <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-white/50">
                  {row.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <p className="eyebrow mb-2">Piattaforma</p>
          <h2 className="text-xl font-bold font-playfair">
            Esplora le Funzionalità di 4 Elementi Italia
          </h2>
        </div>
        <Link to="/dashboard/personalized">
          <Button variant="secondary" size="pill" className="flex items-center gap-2">
            <Layout size={16} />
            <span>Visualizza Dashboard Personalizzata</span>
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <FeaturePreview 
            title="Pannello Amministrazione" 
            description="Gestisci clienti, contenuti, moderazione community e visualizza statistiche complete." 
            icon={<Shield size={24} className="text-white" />}
            linkText="Vai all'Admin" 
            linkPath="/admin/dashboard" 
          />
        )}
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
      
      <ChatAssistant />
    </DashboardLayout>
  );
};

export default Dashboard;
