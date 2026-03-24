
import { useEffect, useState } from "react";
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
import type { LucideIcon } from "lucide-react";
import { getSiteSection, readSectionExtraArray } from "@/lib/api/siteContent";

type FeatureItem = {
  title: string;
  description: string;
  icon: string;
};

const defaultFeatures: FeatureItem[] = [
  {
    title: "Formazione Continua",
    description: "Accedi a corsi video, materiali scaricabili e ottieni certificati automatici per migliorare le tue competenze professionali.",
    icon: "book-open"
  },
  {
    title: "Strumenti di Gestione",
    description: "Organizza la tua attività con calendari digitali, gestione dell'inventario e dashboard analitici completi.",
    icon: "settings"
  },
  {
    title: "Comunità Professionale",
    description: "Connettiti con altre estetiste attraverso forum, condividi testimonianze e partecipa a eventi dal vivo.",
    icon: "users"
  },
  {
    title: "Supporto AI",
    description: "Ricevi consigli personalizzati su business e gestione dei trattamenti attraverso il nostro Assistente AI intelligente.",
    icon: "message-square"
  },
  {
    title: "Dashboard Analitico",
    description: "Monitora KPI, vendite, margini e performance mensili con visualizzazioni belle e facili da comprendere.",
    icon: "bar-chart-3"
  },
  {
    title: "Supporto 24/7",
    description: "Accedi a supporto professionale in qualsiasi momento attraverso vari canali di comunicazione.",
    icon: "help-circle"
  },
  {
    title: "Risultati Garantiti",
    description: "Vedi risultati concreti nella crescita del tuo business grazie ai nostri strumenti e metodi testati.",
    icon: "calendar"
  },
  {
    title: "Esperienza Olistica",
    description: "Un approccio completo che integra competenze tecniche, gestione aziendale e benessere professionale.",
    icon: "heart"
  },
];

const featureIcons: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  calendar: Calendar,
  users: Users,
  "message-square": MessageSquare,
  "bar-chart-3": BarChart3,
  settings: Settings,
  "help-circle": HelpCircle,
  heart: Heart,
};

export function FeaturesWithHoverEffects() {
  const [title, setTitle] = useState("Perché Unirsi a 4 elementi Italia?");
  const [features, setFeatures] = useState<FeatureItem[]>(defaultFeatures);

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      const section = await getSiteSection("home_features");
      if (!mounted || !section) return;

      setTitle(section.title ?? "Perché Unirsi a 4 elementi Italia?");
      const sectionFeatures = readSectionExtraArray<FeatureItem>(section, "hover_features", defaultFeatures);
      if (sectionFeatures.length > 0) {
        setFeatures(sectionFeatures);
      }
    };

    loadContent();
    return () => {
      mounted = false;
    };
  }, []);
  
  return (
    <section id="features" className="py-24 relative bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair text-white">
            {title}
          </h2>
          <div className="w-16 h-1 bg-white mx-auto mt-4 mb-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {features.map((feature, index) => (
            <div key={feature.title} className="glass rounded-xl p-6 hover:scale-105 transition-transform border border-white/10 hover:border-white/20">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-white">
                {(() => {
                  const Icon = featureIcons[feature.icon] ?? BookOpen;
                  return <Icon className="h-6 w-6" />;
                })()}
              </div>
              <h3 className="text-lg font-bold font-playfair text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesWithHoverEffects;
