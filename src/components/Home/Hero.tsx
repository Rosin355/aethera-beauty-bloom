
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-brand-fire/5 rounded-bl-full transform -translate-y-1/4 translate-x-1/4"></div>
        <div className="absolute left-0 bottom-0 w-2/3 h-2/3 bg-brand-water/5 rounded-tr-full transform translate-y-1/4 -translate-x-1/4"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="md:w-1/2 mt-10 md:mt-0 md:pr-10 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair leading-tight text-brand-black">
              Fai Crescere il Tuo <span className="text-brand-fire">Business Beauty</span>
            </h1>
            <p className="mt-6 text-lg text-gray-700 leading-relaxed">
              4 elementi Italia è la piattaforma completa progettata appositamente per estetiste e professionisti della bellezza.
              Sviluppa le tue competenze, gestisci la tua attività in modo efficiente e connettiti con una fiorente comunità professionale.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/signup">
                <Button className="bg-brand-fire hover:bg-brand-fire/90 text-white text-lg px-8 py-6 h-auto shadow-lg shadow-brand-fire/30 transition-all hover:shadow-xl hover:shadow-brand-fire/40">
                  Inizia Ora
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Link to="#features">
                <Button variant="outline" className="border-2 border-brand-black hover:bg-brand-black hover:text-white text-lg px-8 py-6 h-auto transition-all">
                  Esplora le Funzionalità
                </Button>
              </Link>
              <Link to="/dashboard/personalized">
                <Button className="bg-brand-earth hover:bg-brand-earth/90 text-white text-lg px-8 py-6 h-auto shadow-md shadow-brand-earth/20 transition-all hover:shadow-lg hover:shadow-brand-earth/30">
                  Prova la Dashboard Personalizzata
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 animate-fade-in mt-10 md:mt-0">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-water rounded-full blur-3xl opacity-20 transform -translate-x-10 translate-y-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Professionista della bellezza al lavoro"
                className="rounded-2xl shadow-2xl relative z-10 w-full object-cover h-[500px]"
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-lg z-20 max-w-xs border border-gray-100">
                <p className="text-gray-700 font-medium italic">
                  "4 elementi Italia ha trasformato completamente il modo in cui gestisco il mio centro estetico!"
                </p>
                <div className="flex items-center mt-2">
                  <div className="h-8 w-8 rounded-full bg-brand-fire flex items-center justify-center text-white font-bold">S</div>
                  <span className="text-gray-600 text-sm ml-2">Sofia L. | Titolare Centro Estetico</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
