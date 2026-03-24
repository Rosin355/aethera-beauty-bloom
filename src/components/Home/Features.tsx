
import { useEffect, useState } from "react";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  MessageSquare, 
  ChartPie 
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getSiteSection, readSectionExtraArray } from "@/lib/api/siteContent";

type FeatureItem = {
  title: string;
  description: string;
  icon: string;
  color: string;
};

const defaultFeatures: FeatureItem[] = [
  {
    title: "Formazione Continua",
    description: "Accedi a corsi video, materiali scaricabili e ottieni certificati automatici per migliorare le tue competenze professionali.",
    icon: "book-open",
    color: "bg-brand-water",
  },
  {
    title: "Strumenti di Gestione",
    description: "Organizza la tua attività con calendari digitali, gestione dell'inventario e dashboard analitici completi.",
    icon: "calendar",
    color: "bg-brand-fire",
  },
  {
    title: "Comunità Professionale",
    description: "Connettiti con altre estetiste attraverso forum, condividi testimonianze e partecipa a eventi dal vivo.",
    icon: "users",
    color: "bg-brand-air",
  },
  {
    title: "Supporto AI",
    description: "Ricevi consigli personalizzati su business e gestione dei trattamenti attraverso il nostro Assistente AI intelligente.",
    icon: "message-square",
    color: "bg-brand-earth",
  },
  {
    title: "Dashboard Analitico",
    description: "Monitora KPI, vendite, margini e performance mensili con visualizzazioni belle e facili da comprendere.",
    icon: "chart-pie",
    color: "bg-brand-black",
  }
];

const featureIcons: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  calendar: Calendar,
  users: Users,
  "message-square": MessageSquare,
  "chart-pie": ChartPie,
};

const Features = () => {
  const [title, setTitle] = useState("Perché Unirsi a 4 elementi Italia?");
  const [features, setFeatures] = useState<FeatureItem[]>(defaultFeatures);

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      const section = await getSiteSection("home_features");
      if (!mounted || !section) return;

      setTitle(section.title ?? "Perché Unirsi a 4 elementi Italia?");
      const sectionFeatures = readSectionExtraArray<FeatureItem>(section, "features", defaultFeatures);
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
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair text-brand-black">{title}</h2>
          <div className="w-16 h-1 bg-brand-fire mx-auto mt-4 mb-6"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col">
              <div className={`${feature.color} w-12 h-12 rounded-full flex items-center justify-center mb-6`}>
                {(() => {
                  const Icon = featureIcons[feature.icon] ?? BookOpen;
                  return <Icon className="text-white" size={20} />;
                })()}
              </div>
              <h3 className="text-xl font-bold font-playfair mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
