
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="bg-gradient-to-b from-brand-cream to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse md:flex-row md:items-center">
          <div className="md:w-1/2 mt-10 md:mt-0 md:pr-10 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-playfair leading-tight">
              Elevate Your Beauty Business To New Heights
            </h1>
            <p className="mt-6 text-lg text-gray-700 leading-relaxed">
              Aethera is an all-in-one platform designed specifically for beauticians to grow their skills, 
              manage their business efficiently, and connect with a thriving professional community.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/signup">
                <Button className="bg-brand-fire hover:bg-brand-fire/90 text-white text-lg px-8 py-6 h-auto">
                  Get Started
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Link to="#features">
                <Button variant="outline" className="border-brand-black hover:bg-brand-black hover:text-white text-lg px-8 py-6 h-auto">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-water rounded-full blur-3xl opacity-20 transform -translate-x-10 translate-y-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Beautician at work"
                className="rounded-2xl shadow-2xl relative z-10 w-full"
              />
              <div className="absolute -bottom-6 -right-6 bg-brand-earth rounded-xl p-4 shadow-lg z-20 max-w-xs">
                <p className="text-white font-medium">
                  "Aethera transformed how I manage my beauty salon. Highly recommended!"
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-white/80 text-sm">Sofia L. | Beauty Salon Owner</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
