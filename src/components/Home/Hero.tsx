
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import HeroSection from "./HeroSection";

const Hero = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 gradient-bg-1"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-50">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl animate-float delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>
      
      <HeroSection
        badge={{
          text: "Nuovi corsi di formazione disponibili",
          action: {
            text: "Scopri di più",
            href: "/training",
          },
        }}
        title="La Piattaforma Completa per Professioniste della Bellezza"
        description="Strumenti di gestione, formazione continua, supporto personalizzato e una comunità professionale per far crescere il tuo business nel mondo beauty."
        actions={[
          {
            text: "Inizia Ora",
            href: "/signup",
            variant: "default",
            icon: <Sparkles className="h-5 w-5" />,
          },
          {
            text: "Esplora le Funzionalità",
            href: "/features",
            variant: "outline",
            icon: <BookOpen className="h-5 w-5" />,
          },
        ]}
        image={{
          light: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
          dark: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
          alt: "Professionista della bellezza al lavoro",
        }}
      />
    </div>
  );
};

export default Hero;
