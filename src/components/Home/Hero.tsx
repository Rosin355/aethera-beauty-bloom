
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative w-full h-screen bg-black text-white flex flex-col justify-center">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
          alt="Background" 
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/40"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-[-100px]">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-playfair leading-tight">
            Dove le Professioniste della Bellezza si Incontrano, Imparano e Crescono
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 font-inter">
            La piattaforma completa per supportare la tua crescita professionale e operativa nel mondo beauty
          </p>
          <div className="mt-10">
            <Link to="/signup">
              <Button className="bg-white hover:bg-gray-100 text-black font-medium text-lg px-8 py-6 h-auto rounded-none transition-all">
                Inizia Ora
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
