
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background minimale */}
      <div className="absolute inset-0 gradient-bg-3"></div>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/3 rounded-full blur-3xl animate-float delay-1000"></div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold font-playfair leading-tight text-white">
              Pronta a <span className="gradient-text">Trasformare</span> il Tuo Business Beauty?
            </h2>
            <div className="w-16 h-1 bg-white mt-6 mb-8"></div>
            <p className="text-xl text-gray-300">
              Unisciti a migliaia di professioniste della bellezza che stanno elevando le loro competenze con 4 elementi Italia.
            </p>
            <ul className="mt-8 space-y-4">
              {['Prova gratuita di 14 giorni', 'Nessuna carta di credito richiesta', 'Cancella in qualsiasi momento'].map((item, index) => (
                <li key={index} className="flex items-center">
                  <div className="bg-white rounded-full p-1 mr-3">
                    <Check className="h-5 w-5 text-black"/>
                  </div>
                  <span className="text-gray-300 text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col space-y-6">
            <div className="glass-strong p-8 rounded-2xl relative overflow-hidden group border border-white/10 hover:border-white/20">
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-all duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <Sparkles className="h-6 w-6 text-white mr-2" />
                  <h3 className="text-2xl font-bold text-white">Inizia Oggi</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Crea il tuo account ora e inizia ad esplorare tutte le funzionalità che 4 elementi Italia ha da offrire.
                </p>
                <Link to="/signup" className="block">
                  <Button className="w-full bg-white text-black hover:bg-gray-200 text-lg py-6 h-auto rounded-xl border-0 font-medium">
                    Registrati Gratuitamente
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
