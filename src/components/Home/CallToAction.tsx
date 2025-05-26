
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 gradient-bg-3"></div>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/40 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-500/40 rounded-full blur-3xl animate-float delay-1000"></div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold font-playfair leading-tight text-white">
              Pronta a <span className="gradient-text">Trasformare</span> il Tuo Business Beauty?
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mt-6 mb-8"></div>
            <p className="text-xl text-gray-300">
              Unisciti a migliaia di professioniste della bellezza che stanno elevando le loro competenze con 4 elementi Italia.
            </p>
            <ul className="mt-8 space-y-4">
              {['Prova gratuita di 14 giorni', 'Nessuna carta di credito richiesta', 'Cancella in qualsiasi momento'].map((item, index) => (
                <li key={index} className="flex items-center">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1 mr-3">
                    <Check className="h-5 w-5 text-white"/>
                  </div>
                  <span className="text-gray-300 text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col space-y-6">
            <div className="glass-strong p-8 rounded-2xl relative overflow-hidden group">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <Sparkles className="h-6 w-6 text-purple-400 mr-2" />
                  <h3 className="text-2xl font-bold text-white">Inizia Oggi</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  Crea il tuo account ora e inizia ad esplorare tutte le funzionalità che 4 elementi Italia ha da offrire.
                </p>
                <Link to="/signup" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6 h-auto rounded-xl border-0 glow-effect">
                    Registrati Gratuitamente
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              </div>
              
              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-purple-500/50 transition-all duration-300"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
