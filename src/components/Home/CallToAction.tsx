
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold font-playfair leading-tight">
              Pronta a Trasformare il Tuo Business Beauty?
            </h2>
            <div className="w-16 h-1 bg-brand-fire mt-6 mb-8"></div>
            <p className="text-xl text-gray-300">
              Unisciti a migliaia di professioniste della bellezza che stanno elevando le loro competenze con 4 elementi Italia.
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
          <div className="flex flex-col space-y-6">
            <div className="bg-white/10 p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">Inizia Oggi</h3>
              <p className="text-gray-300 mb-6">
                Crea il tuo account ora e inizia ad esplorare tutte le funzionalità che 4 elementi Italia ha da offrire.
              </p>
              <Link to="/signup" className="block">
                <Button className="w-full bg-white hover:bg-gray-100 text-black text-lg py-6 h-auto rounded-none">
                  Registrati Gratuitamente
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
