
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-brand-black to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-fire to-transparent transform rotate-3"></div>
          <div className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-t from-brand-water to-transparent transform -rotate-3"></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-16 border border-white/10 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl md:text-5xl font-bold font-playfair text-white leading-tight">
                Pronta a Trasformare il Tuo Business Beauty?
              </h2>
              <div className="w-24 h-1 bg-brand-fire mt-6 mb-8"></div>
              <p className="text-xl text-gray-300">
                Unisciti a migliaia di professioniste della bellezza che stanno elevando le loro competenze e facendo crescere la loro attività con 4 elementi Italia.
              </p>
              <ul className="mt-8 space-y-4">
                {['Prova gratuita di 14 giorni', 'Nessuna carta di credito richiesta', 'Cancella in qualsiasi momento'].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <div className="bg-brand-fire/20 rounded-full p-1 mr-3">
                      <Check className="h-5 w-5 text-brand-fire"/>
                    </div>
                    <span className="text-gray-300 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col space-y-6 animate-slide-up">
              <div className="bg-white/10 rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-colors duration-300">
                <h3 className="text-2xl font-bold text-white mb-2">Inizia Oggi</h3>
                <p className="text-gray-300 mb-6">
                  Crea il tuo account ora e inizia ad esplorare tutte le funzionalità che 4 elementi Italia ha da offrire.
                </p>
                <Link to="/signup" className="block">
                  <Button className="w-full bg-brand-fire hover:bg-brand-fire/90 text-white text-lg py-6 h-auto shadow-lg shadow-brand-fire/30">
                    Registrati Gratuitamente
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="bg-white/10 rounded-xl p-8 border border-white/20 hover:bg-white/15 transition-colors duration-300">
                <h3 className="text-2xl font-bold text-white mb-2">Accedi alla Tua Dashboard</h3>
                <p className="text-gray-300 mb-6">
                  Sei già membro? Accedi alla tua dashboard personalizzata per continuare il tuo percorso di crescita.
                </p>
                <div className="flex flex-col space-y-3">
                  <Link to="/dashboard" className="block">
                    <Button variant="outline" className="w-full border-2 border-white text-white hover:bg-white hover:text-brand-black text-lg py-5 h-auto">
                      Dashboard Standard
                    </Button>
                  </Link>
                  <Link to="/dashboard/personalized" className="block">
                    <Button className="w-full bg-brand-earth hover:bg-brand-earth/90 text-white text-lg py-5 h-auto shadow-lg shadow-brand-earth/30">
                      Dashboard Personalizzata
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
