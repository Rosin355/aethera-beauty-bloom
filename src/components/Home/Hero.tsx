
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const Hero = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradiente come Stardust - parte nero e finisce con colori */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(135deg, 
                #000000 0%, 
                #0a0a0a 25%, 
                #1a0a2e 50%, 
                #3d1a78 75%, 
                #6b46c1 85%, 
                #9333ea 95%, 
                #a855f7 100%
              )
            `
          }}
        ></div>
        {/* Overlay gradiente per sfumatura più morbida */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at center bottom, 
                rgba(168, 85, 247, 0.3) 0%, 
                rgba(147, 51, 234, 0.2) 30%, 
                rgba(107, 70, 193, 0.1) 60%, 
                rgba(0, 0, 0, 0.8) 100%
              )
            `
          }}
        ></div>
      </div>
      
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center gap-6 text-center relative z-10">
            {/* Badge */}
            <Badge variant="outline" className="animate-appear gap-2 glass border-purple-500/30 text-purple-200 mb-4">
              <span className="text-purple-300">Nuovi corsi di formazione disponibili</span>
              <Link to="/training" className="flex items-center gap-1 text-purple-200 hover:text-white transition-colors">
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
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 glow-effect text-lg px-8 py-4"
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
                className="glass border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4"
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
