
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { cn } from "@/lib/utils";

const Hero = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Enhanced Background Gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-orange-900/40"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-purple-800/30 to-pink-800/20"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-500/40 rounded-full blur-3xl animate-float delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-3xl"></div>
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
