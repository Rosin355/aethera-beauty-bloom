
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const Hero = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background minimale nero con sfumature sottili */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, 
                #000000 0%, 
                #0a0a0a 25%, 
                #1a1a1a 50%, 
                #2a2a2a 75%, 
                #1a1a1a 85%, 
                #0a0a0a 95%, 
                #000000 100%
              )
            `
          }}
        ></div>
        {/* Overlay sottile per profondità */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at center bottom, 
                rgba(255, 255, 255, 0.02) 0%, 
                rgba(255, 255, 255, 0.01) 30%, 
                rgba(0, 0, 0, 0.2) 60%, 
                rgba(0, 0, 0, 0.9) 100%
              )
            `
          }}
        ></div>
      </div>
      
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center gap-6 text-center relative z-10">
            {/* Badge */}
            <Badge variant="outline" className="animate-appear gap-2 glass border-white/20 text-gray-300 mb-4">
              <span className="text-gray-200">Nuovi corsi di formazione disponibili</span>
              <Link to="/training" className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors">
                Scopri di più
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Badge>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-playfair leading-tight text-white mb-6">
              La Piattaforma Completa per{" "}
              <span className="gradient-text">Professioniste della Bellezza</span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl max-w-3xl text-gray-300 font-medium mb-8">
              Strumenti di gestione, formazione continua, supporto personalizzato e una comunità professionale per far crescere il tuo business nel mondo beauty.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                asChild
                className="bg-white text-black hover:bg-gray-200 border-0 text-lg px-8 py-4 font-medium"
              >
                <Link to="/signup" className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Inizia Ora
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                asChild
                className="glass border-white/30 text-white hover:bg-white/5 text-lg px-8 py-4"
              >
                <Link to="/features" className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Esplora le Funzionalità
                </Link>
              </Button>
            </div>
          </div>
        }
      >
        <img
          src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
          alt="Professionista della bellezza al lavoro"
          className="mx-auto rounded-2xl object-cover h-full w-full object-center"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
};

export default Hero;
