
import { cn } from "@/lib/utils";
import {
  Terminal,
  ChevronDown,
  ArrowUp,
  Cloud,
  Settings,
  HelpCircle,
  Heart,
  BarChart3
} from "lucide-react";

export function FeaturesWithHoverEffects() {
  const features = [
    {
      title: "Formazione Continua",
      description: "Accedi a corsi video, materiali scaricabili e ottieni certificati automatici per migliorare le tue competenze professionali.",
      icon: <Terminal className="h-6 w-6" />,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Strumenti di Gestione",
      description: "Organizza la tua attività con calendari digitali, gestione dell'inventario e dashboard analitici completi.",
      icon: <Settings className="h-6 w-6" />,
      gradient: "from-blue-500 to-purple-500"
    },
    {
      title: "Comunità Professionale",
      description: "Connettiti con altre estetiste attraverso forum, condividi testimonianze e partecipa a eventi dal vivo.",
      icon: <ChevronDown className="h-6 w-6" />,
      gradient: "from-pink-500 to-red-500"
    },
    {
      title: "Supporto AI",
      description: "Ricevi consigli personalizzati su business e gestione dei trattamenti attraverso il nostro Assistente AI intelligente.",
      icon: <Cloud className="h-6 w-6" />,
      gradient: "from-green-500 to-blue-500"
    },
    {
      title: "Dashboard Analitico",
      description: "Monitora KPI, vendite, margini e performance mensili con visualizzazioni belle e facili da comprendere.",
      icon: <BarChart3 className="h-6 w-6" />,
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      title: "Supporto 24/7",
      description: "Accedi a supporto professionale in qualsiasi momento attraverso vari canali di comunicazione.",
      icon: <HelpCircle className="h-6 w-6" />,
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      title: "Risultati Garantiti",
      description: "Vedi risultati concreti nella crescita del tuo business grazie ai nostri strumenti e metodi testati.",
      icon: <ArrowUp className="h-6 w-6" />,
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      title: "Esperienza Olistica",
      description: "Un approccio completo che integra competenze tecniche, gestione aziendale e benessere professionale.",
      icon: <Heart className="h-6 w-6" />,
      gradient: "from-rose-500 to-pink-500"
    },
  ];
  
  return (
    <section id="features" className="py-24 relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-bg-2 opacity-30"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-playfair gradient-text">Perché Unirsi a 4 elementi Italia?</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 mb-6"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
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
  gradient,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  index: number;
}) => {
  return (
    <div className="group relative">
      <div className="glass card-hover p-8 h-full rounded-2xl relative overflow-hidden">
        {/* Gradient overlay on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-300",
          gradient
        )}></div>
        
        {/* Icon with gradient background */}
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br text-white relative z-10",
          gradient
        )}>
          {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold font-playfair mb-3 text-white relative z-10 group-hover:text-purple-200 transition-colors">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-300 relative z-10 group-hover:text-gray-200 transition-colors">
          {description}
        </p>
        
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-purple-500/50 transition-all duration-300"></div>
      </div>
    </div>
  );
};

export default FeaturesWithHoverEffects;
