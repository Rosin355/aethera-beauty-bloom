
import {
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Heart
} from "lucide-react";
import { GradientCard } from "@/components/ui/gradient-card";

export function FeaturesWithHoverEffects() {
  const features = [
    {
      title: "Formazione Continua",
      description: "Accedi a corsi video, materiali scaricabili e ottieni certificati automatici per migliorare le tue competenze professionali.",
      icon: <BookOpen className="h-6 w-6" />
    },
    {
      title: "Strumenti di Gestione",
      description: "Organizza la tua attività con calendari digitali, gestione dell'inventario e dashboard analitici completi.",
      icon: <Settings className="h-6 w-6" />
    },
    {
      title: "Comunità Professionale",
      description: "Connettiti con altre estetiste attraverso forum, condividi testimonianze e partecipa a eventi dal vivo.",
      icon: <Users className="h-6 w-6" />
    },
    {
      title: "Supporto AI",
      description: "Ricevi consigli personalizzati su business e gestione dei trattamenti attraverso il nostro Assistente AI intelligente.",
      icon: <MessageSquare className="h-6 w-6" />
    },
    {
      title: "Dashboard Analitico",
      description: "Monitora KPI, vendite, margini e performance mensili con visualizzazioni belle e facili da comprendere.",
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      title: "Supporto 24/7",
      description: "Accedi a supporto professionale in qualsiasi momento attraverso vari canali di comunicazione.",
      icon: <HelpCircle className="h-6 w-6" />
    },
    {
      title: "Risultati Garantiti",
      description: "Vedi risultati concreti nella crescita del tuo business grazie ai nostri strumenti e metodi testati.",
      icon: <Calendar className="h-6 w-6" />
    },
    {
      title: "Esperienza Olistica",
      description: "Un approccio completo che integra competenze tecniche, gestione aziendale e benessere professionale.",
      icon: <Heart className="h-6 w-6" />
    },
  ];
  
  return (
    <section id="features" className="py-24 relative bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair text-white">
            Perché Unirsi a 4 elementi Italia?
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 mb-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {features.map((feature, index) => (
            <GradientCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesWithHoverEffects;
