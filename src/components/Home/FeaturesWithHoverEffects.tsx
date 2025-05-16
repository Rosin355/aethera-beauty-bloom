
import { cn } from "@/lib/utils";
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ArrowUp,
  Cloud,
  Settings,
  HelpCircle,
  Heart
} from "lucide-react";

export function FeaturesWithHoverEffects() {
  const features = [
    {
      title: "Formazione Continua",
      description: "Accedi a corsi video, materiali scaricabili e ottieni certificati automatici per migliorare le tue competenze professionali.",
      icon: <Terminal className="h-6 w-6" />,
    },
    {
      title: "Strumenti di Gestione",
      description: "Organizza la tua attività con calendari digitali, gestione dell'inventario e dashboard analitici completi.",
      icon: <Settings className="h-6 w-6" />,
    },
    {
      title: "Comunità Professionale",
      description: "Connettiti con altre estetiste attraverso forum, condividi testimonianze e partecipa a eventi dal vivo.",
      icon: <ChevronDown className="h-6 w-6" />,
    },
    {
      title: "Supporto AI",
      description: "Ricevi consigli personalizzati su business e gestione dei trattamenti attraverso il nostro Assistente AI intelligente.",
      icon: <Cloud className="h-6 w-6" />,
    },
    {
      title: "Dashboard Analitico",
      description: "Monitora KPI, vendite, margini e performance mensili con visualizzazioni belle e facili da comprendere.",
      icon: <ArrowUp className="h-6 w-6" />,
    },
    {
      title: "Supporto 24/7",
      description: "Accedi a supporto professionale in qualsiasi momento attraverso vari canali di comunicazione.",
      icon: <HelpCircle className="h-6 w-6" />,
    },
    {
      title: "Risultati Garantiti",
      description: "Vedi risultati concreti nella crescita del tuo business grazie ai nostri strumenti e metodi testati.",
      icon: <Settings className="h-6 w-6" />,
    },
    {
      title: "Esperienza Olistica",
      description: "Un approccio completo che integra competenze tecniche, gestione aziendale e benessere professionale.",
      icon: <Heart className="h-6 w-6" />,
    },
  ];
  
  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair text-foreground">Perché Unirsi a 4 elementi Italia?</h2>
          <div className="w-16 h-1 bg-brand-fire mx-auto mt-4 mb-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-neutral-200 dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l border-neutral-200 dark:border-neutral-800",
        index < 4 && "lg:border-b border-neutral-200 dark:border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-brand-fire transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};

export default FeaturesWithHoverEffects;
