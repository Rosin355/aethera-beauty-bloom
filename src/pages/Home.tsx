
import { Helmet } from "react-helmet";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import Hero from "@/components/Home/Hero";
import FeaturesWithHoverEffects from "@/components/Home/FeaturesWithHoverEffects";
import Testimonials from "@/components/Home/Testimonials";
import CallToAction from "@/components/Home/CallToAction";

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
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
      </div>
    </>
  );
};

export default Home;
