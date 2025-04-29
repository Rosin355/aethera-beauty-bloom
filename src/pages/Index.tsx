
import { Helmet } from "react-helmet";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import Hero from "@/components/Home/Hero";
import Features from "@/components/Home/Features";
import Testimonials from "@/components/Home/Testimonials";
import CallToAction from "@/components/Home/CallToAction";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Aethera - Beauty Business Growth Platform</title>
        <meta name="description" content="A multifunctional portal to support the professional and operational growth of beauticians." />
      </Helmet>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Hero />
          <Features />
          <Testimonials />
          <CallToAction />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
