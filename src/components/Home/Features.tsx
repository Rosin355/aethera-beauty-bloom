
import { 
  BookOpen, 
  Calendar, 
  Users, 
  MessageSquare, 
  ChartPie 
} from "lucide-react";

const features = [
  {
    title: "Formazione Continua",
    description: "Accedi a corsi video, materiali scaricabili e ottieni certificati automatici per migliorare le tue competenze professionali.",
    icon: BookOpen,
    color: "bg-brand-water",
    delay: "0"
  },
  {
    title: "Strumenti di Gestione",
    description: "Organizza la tua attività con calendari digitali, gestione dell'inventario e dashboard analitici completi.",
    icon: Calendar,
    color: "bg-brand-fire",
    delay: "100"
  },
  {
    title: "Comunità Professionale",
    description: "Connettiti con altre estetiste attraverso forum, condividi testimonianze e partecipa a eventi dal vivo.",
    icon: Users,
    color: "bg-brand-air",
    delay: "200"
  },
  {
    title: "Supporto AI",
    description: "Ricevi consigli personalizzati su business e gestione dei trattamenti attraverso il nostro Assistente AI intelligente.",
    icon: MessageSquare,
    color: "bg-brand-earth",
    delay: "300"
  },
  {
    title: "Dashboard Analitico",
    description: "Monitora KPI, vendite, margini e performance mensili con visualizzazioni belle e facili da comprendere.",
    icon: ChartPie,
    color: "bg-brand-black",
    delay: "400"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold font-playfair text-brand-black">Funzionalità Complete per Professionisti della Bellezza</h2>
          <div className="w-24 h-1 bg-brand-fire mx-auto mt-4 mb-6"></div>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Tutto ciò di cui hai bisogno per far crescere la tua attività nel settore beauty, migliorare le tue competenze e connetterti con la tua comunità.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${feature.delay}ms` }}
            >
              <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="text-white" size={28} />
              </div>
              <h3 className="text-2xl font-bold font-playfair mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
