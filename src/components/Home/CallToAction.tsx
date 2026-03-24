
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { getSiteSection, readSectionExtraArray, readSectionExtraObject } from "@/lib/api/siteContent";

type CallToActionExtra = {
  title_suffix?: string;
  card_title?: string;
  card_body?: string;
};

const CallToAction = () => {
  const [content, setContent] = useState({
    title: "Pronta a",
    subtitle: "Trasformare",
    titleSuffix: "il Tuo Business Beauty?",
    body: "Unisciti a migliaia di professioniste della bellezza che stanno elevando le loro competenze con 4 elementi Italia.",
    ctaLabel: "Registrati Gratuitamente",
    ctaLink: "/signup",
    cardTitle: "Inizia Oggi",
    cardBody: "Crea il tuo account ora e inizia ad esplorare tutte le funzionalità che 4 elementi Italia ha da offrire.",
    benefits: ['Prova gratuita di 14 giorni', 'Nessuna carta di credito richiesta', 'Cancella in qualsiasi momento'],
  });

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      const section = await getSiteSection("home_call_to_action");
      if (!mounted || !section) return;

      const extraObject = readSectionExtraObject<CallToActionExtra>(section, {});
      const benefits = readSectionExtraArray<string>(section, "benefits", content.benefits);

      setContent((prev) => ({
        ...prev,
        title: section.title ?? prev.title,
        subtitle: section.subtitle ?? prev.subtitle,
        titleSuffix: extraObject.title_suffix ?? prev.titleSuffix,
        body: section.body ?? prev.body,
        ctaLabel: section.cta_label ?? prev.ctaLabel,
        ctaLink: section.cta_link ?? prev.ctaLink,
        cardTitle: extraObject.card_title ?? prev.cardTitle,
        cardBody: extraObject.card_body ?? prev.cardBody,
        benefits: benefits.length > 0 ? benefits : prev.benefits,
      }));
    };

    loadContent();
    return () => {
      mounted = false;
    };
  }, []);

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
              {content.title} <span className="gradient-text">{content.subtitle}</span> {content.titleSuffix}
            </h2>
            <div className="w-16 h-1 bg-white mt-6 mb-8"></div>
            <p className="text-xl text-gray-300">
              {content.body}
            </p>
            <ul className="mt-8 space-y-4">
              {content.benefits.map((item, index) => (
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
                  <h3 className="text-2xl font-bold text-white">{content.cardTitle}</h3>
                </div>
                <p className="text-gray-300 mb-6">
                  {content.cardBody}
                </p>
                <Link to={content.ctaLink} className="block">
                  <Button className="w-full bg-white text-black hover:bg-gray-200 text-lg py-6 h-auto rounded-xl border-0 font-medium">
                    {content.ctaLabel}
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
