
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import HeroSection from "./HeroSection";

const Hero = () => {
  return (
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
        dark: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80&auto=format&fit=crop&w=1200&q=80",
        alt: "Professionista della bellezza al lavoro",
      }}
    />
  );
};

export default Hero;
