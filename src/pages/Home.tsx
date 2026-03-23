
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import Hero from "@/components/Home/Hero";
import FeaturesWithHoverEffects from "@/components/Home/FeaturesWithHoverEffects";
import Testimonials from "@/components/Home/Testimonials";
import CallToAction from "@/components/Home/CallToAction";
import { Button } from "@/components/ui/button";

const Home = () => {
  const { user } = useAuth();
  return (
    <>
      <Helmet>
        <title>4 elementi Italia - Piattaforma di Crescita per Beauty Business</title>
        <meta name="description" content="Una piattaforma multifunzionale per supportare la crescita professionale e operativa delle estetiste." />
      </Helmet>
      <div className="flex flex-col min-h-screen dark:bg-gray-950">
        <Navbar />
        <main className="flex-grow">
          <Hero />
          <FeaturesWithHoverEffects />
          <Testimonials />
          <CallToAction />
        </main>
        <Footer />
        
        {/* Floating Dashboard Link for Authenticated Users */}
        {user && (
          <Link to="/dashboard" className="fixed bottom-6 right-6 z-50">
            <Button className="bg-accent text-white shadow-lg hover:bg-accent/90 transition-all">
              <ArrowRight className="mr-2" size={20} />
              Vai alla Dashboard
            </Button>
          </Link>
        )}
      </div>
    </>
  );
};

export default Home;
