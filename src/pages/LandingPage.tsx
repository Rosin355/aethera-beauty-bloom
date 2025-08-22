import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GlowCard } from "@/components/ui/spotlight-card";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Check, Play, Users, Award, BookOpen, Headphones } from "lucide-react";
import { Glow } from "@/components/ui/glow";
const LandingPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
  };
  return <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Glow variant="top" className="opacity-30" />
      
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/4-elementi-logo.png" alt="4 Elementi Italia Logo" className="h-12 w-auto" />
            
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#video" className="text-muted-foreground hover:text-foreground transition-colors">VIDEO GRATUITO</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">CHI SIAMO</a>
            <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">SERVIZI</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">CONTATTI</a>
          </nav>
        </div>
      </header>

      {/* Hero Section with Aurora Background */}
      <AuroraBackground className="h-auto py-16">
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="font-playfair text-4xl lg:text-6xl font-bold leading-tight text-foreground">
                  SEI UN'ESTETISTA
                  <span className="gradient-text"> PROFESSIONISTA?</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Ecco come strutturare il tuo listino in modo strategico (senza stress)
                </p>
              </div>
              
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  Ciao! Se sei un'estetista professionista e ti stai chiedendo come strutturare un listino prezzi che sia chiaro, professionale e che valorizzi davvero i tuoi servizi... sei nel posto giusto.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Mi chiamo <strong className="text-white">Davide</strong> e con <strong className="text-white">4 Elementi Italia</strong> aiutiamo estetiste e professionisti del benessere a diventare imprenditori consapevoli, strategici e autonomi – senza stress, senza perdere tempo in corsi complicati o contenuti poco chiari.
                </p>
              </div>

              <Button size="lg" className="bg-white hover:bg-gray-200 text-black px-8 py-6 text-lg font-medium">
                <Play className="w-5 h-5 mr-2" />
                ACCEDI AL VIDEO GRATUITO
              </Button>
            </div>

            <div className="relative space-y-6">
              {/* Video Placeholder */}
              <div className="w-full aspect-video bg-card/30 backdrop-blur-sm border-white/10 border rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white font-medium">Video Tutorial Gratuito</p>
                  <p className="text-muted-foreground text-sm">Il video apparirà qui</p>
                </div>
              </div>
              
              <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-playfair text-2xl font-bold mb-4">ACCEDI AL VIDEO GRATUITO</h3>
                    <p className="text-muted-foreground">Compila il form e ricevi subito il link</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input placeholder="Il tuo nome" value={formData.name} onChange={e => setFormData({
                    ...formData,
                    name: e.target.value
                  })} className="bg-background/50 border-white/20" />
                    <Input type="email" placeholder="La tua email" value={formData.email} onChange={e => setFormData({
                    ...formData,
                    email: e.target.value
                  })} className="bg-background/50 border-white/20" />
                    <Button type="submit" className="w-full bg-white hover:bg-gray-200 text-black font-medium">
                      RICEVI IL VIDEO GRATUITO
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </AuroraBackground>

      {/* What You'll Learn */}
      <section id="video" className="relative z-10 px-4 py-16">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl lg:text-4xl font-bold mb-4">
              COSA IMPARERAI NEL VIDEO
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ti mostro, passo dopo passo, tutto quello che serve per creare un listino strategico e professionale
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <GlowCard glowColor="orange" customSize className="w-full p-8 text-center aspect-auto h-auto">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4 text-white">CALCOLO DEL COSTO ORARIO</h3>
              <p className="text-muted-foreground">
                Come organizzare il tuo listino in modo strategico (anche se non sei brava con i numeri o il marketing)
              </p>
            </GlowCard>

            <GlowCard glowColor="blue" customSize className="w-full p-8 text-center aspect-auto h-auto">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4 text-white">CALCOLO DEL PRODOTTO</h3>
              <p className="text-muted-foreground">
                Cosa scrivere per trasmettere professionalità e farti scegliere dai tuoi clienti
              </p>
            </GlowCard>

            <GlowCard glowColor="green" customSize className="w-full p-8 text-center aspect-auto h-auto">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4 text-white">CREA IL LISTINO PREZZI EFFICACE</h3>
              <p className="text-muted-foreground">
                Come creare un listino grafico accattivante e facile da aggiornare, direttamente con Canva
              </p>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="relative z-10 px-4 py-16 bg-card/20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-playfair text-3xl lg:text-4xl font-bold mb-6 text-white">
                UN LISTINO BEN FATTO NON È SOLO UNA 
                <span className="gradient-text"> TABELLA DI PREZZI</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                È uno strumento di marketing. Ti aiuta a:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <p className="text-muted-foreground">Farti percepire come una vera professionista</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <p className="text-muted-foreground">Comunicare il tuo valore senza doverlo giustificare</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <p className="text-muted-foreground">Vendere meglio, senza svenderti</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-8 text-center">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-playfair text-2xl font-bold text-white">È GRATUITO. È PRATICO.</h3>
                  <p className="text-muted-foreground">È pensato per te.</p>
                  <p className="text-sm text-muted-foreground">
                    📩 Riceverai immediatamente il link per guardarlo quando vuoi, dove vuoi.
                  </p>
                  <Button className="bg-white hover:bg-gray-200 text-black px-8 font-medium">
                    ACCEDI SUBITO AL VIDEO
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 px-4 py-16">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl lg:text-4xl font-bold mb-4 text-white">CHI SIAMO</h2>
            <div className="w-24 h-1 bg-white mx-auto"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/30 backdrop-blur-sm border-white/10 p-8 lg:p-12">
              <div className="space-y-6 text-center">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  <strong className="text-white">4 Elementi Italia</strong> è una realtà nata per trasformare i centri estetici e i professionisti del beauty in vere imprese consapevoli. Con oltre <strong className="text-white">10 anni di esperienza</strong> nel settore, uniamo formazione, strategia e strumenti digitali per supportare estetiste e professionisti del benessere nel loro percorso di crescita.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Il nostro metodo è <strong className="text-white">personalizzato, pratico e accessibile</strong>. Crediamo che ogni centro debba avere una visione chiara, un'identità forte e una gestione organizzata.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Collaboriamo con brand d'eccellenza come <strong className="text-white">Tokio, Nee Make Up Milano ed Everlinespa</strong>, per garantire qualità, innovazione e prestigio.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="relative z-10 px-4 py-16 bg-card/20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl lg:text-4xl font-bold mb-4 text-white">I NOSTRI SERVIZI</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tutto quello che serve per trasformare il tuo centro estetico in una vera impresa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <GlowCard glowColor="red" customSize className="w-full p-8 aspect-auto h-auto">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4 text-white">FORMAZIONE STRATEGICA</h3>
              <p className="text-muted-foreground">Per diventare imprenditori nel beauty</p>
            </GlowCard>

            <GlowCard glowColor="blue" customSize className="w-full p-8 aspect-auto h-auto">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4 text-white">PIATTAFORMA DIGITALE</h3>
              <p className="text-muted-foreground">Con strumenti gestionali e supporto AI</p>
            </GlowCard>

            <GlowCard glowColor="purple" customSize className="w-full p-8 aspect-auto h-auto">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Headphones className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4 text-white">CONSULENZE PERSONALIZZATE</h3>
              <p className="text-muted-foreground">Per organizzazione, listino, marketing e posizionamento</p>
            </GlowCard>

            <GlowCard glowColor="orange" customSize className="w-full p-8 aspect-auto h-auto">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4 text-white">VIDEO CORSI</h3>
              <p className="text-muted-foreground">E materiali pratici da applicare subito nel tuo centro</p>
            </GlowCard>

            <GlowCard glowColor="green" customSize className="w-full p-8 aspect-auto h-auto">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4 text-white">COMMUNITY ESCLUSIVA</h3>
              <p className="text-muted-foreground">Per confrontarti con altri professionisti e crescere insieme</p>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="relative z-10 px-4 py-16">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="font-playfair text-3xl lg:text-4xl font-bold text-white">
              TRASFORMA IL TUO CENTRO ESTETICO IN UNA 
              <span className="gradient-text"> VERA IMPRESA</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Se vuoi trasformare il tuo centro estetico in una vera impresa, sei nel posto giusto. ✨
            </p>
            <div className="space-y-4">
              <p className="text-lg font-semibold">Ti aspetto dall'altra parte!</p>
              <p className="text-muted-foreground">
                <strong className="text-white">Davide</strong> – Fondatore di 4 Elementi Italia
              </p>
            </div>
            <Button size="lg" className="bg-white hover:bg-gray-200 text-black px-12 py-6 text-lg font-medium">
              <Play className="w-6 h-6 mr-3" />
              ACCEDI AL VIDEO GRATUITO
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-8 border-t border-white/10">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/4-elementi-logo.png" alt="4 Elementi Italia Logo" className="h-10 w-auto" />
            
          </div>
          <p className="text-muted-foreground">
            © 2024 4 Elementi Italia. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>;
};
export default LandingPage;