import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, Play, Users, Award, BookOpen, Headphones } from "lucide-react";
import { Glow } from "@/components/ui/glow";

const LandingPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Glow variant="top" className="opacity-30" />
      
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-fire rounded-full flex items-center justify-center">
              <span className="text-background font-bold text-sm">4E</span>
            </div>
            <span className="font-playfair font-bold text-xl">4 ELEMENTI ITALIA</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#video" className="text-muted-foreground hover:text-foreground transition-colors">VIDEO GRATUITO</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">CHI SIAMO</a>
            <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">SERVIZI</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">CONTATTI</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 py-16">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="font-playfair text-4xl lg:text-6xl font-bold leading-tight">
                  SEI UN'ESTETISTA O UN 
                  <span className="text-brand-fire"> PARRUCCHIERE?</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Ecco come strutturare il tuo listino in modo strategico (senza stress)
                </p>
              </div>
              
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  Ciao! Se sei un'estetista professionista o un parrucchiere e ti stai chiedendo come strutturare un listino prezzi che sia chiaro, professionale e che valorizzi davvero i tuoi servizi... sei nel posto giusto.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Mi chiamo <strong className="text-foreground">Davide</strong> e con <strong className="text-brand-fire">4 Elementi Italia</strong> aiutiamo estetiste e professionisti del benessere a diventare imprenditori consapevoli, strategici e autonomi – senza stress, senza perdere tempo in corsi complicati o contenuti poco chiari.
                </p>
              </div>

              <Button size="lg" className="bg-brand-fire hover:bg-brand-fire/90 text-background px-8 py-6 text-lg">
                <Play className="w-5 h-5 mr-2" />
                ACCEDI AL VIDEO GRATUITO
              </Button>
            </div>

            <div className="relative">
              <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-playfair text-2xl font-bold mb-4">VIDEO TUTORIAL GRATUITO</h3>
                    <p className="text-muted-foreground">Compila il form e ricevi subito il link</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      placeholder="Il tuo nome"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-background/50 border-white/20"
                    />
                    <Input
                      type="email"
                      placeholder="La tua email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-background/50 border-white/20"
                    />
                    <Button type="submit" className="w-full bg-brand-fire hover:bg-brand-fire/90 text-background">
                      RICEVI IL VIDEO GRATUITO
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

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
            <Card className="bg-card/30 backdrop-blur-sm border-white/10 p-8 text-center">
              <div className="w-16 h-16 bg-brand-fire/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-brand-fire" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4">ORGANIZZAZIONE STRATEGICA</h3>
              <p className="text-muted-foreground">
                Come organizzare il tuo listino in modo strategico (anche se non sei brava con i numeri o il marketing)
              </p>
            </Card>

            <Card className="bg-card/30 backdrop-blur-sm border-white/10 p-8 text-center">
              <div className="w-16 h-16 bg-brand-water/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-brand-water" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4">COMUNICAZIONE PROFESSIONALE</h3>
              <p className="text-muted-foreground">
                Cosa scrivere per trasmettere professionalità e farti scegliere dai tuoi clienti
              </p>
            </Card>

            <Card className="bg-card/30 backdrop-blur-sm border-white/10 p-8 text-center">
              <div className="w-16 h-16 bg-brand-earth/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-brand-earth" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4">DESIGN ACCATTIVANTE</h3>
              <p className="text-muted-foreground">
                Come creare un listino grafico accattivante e facile da aggiornare, direttamente con Canva
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="relative z-10 px-4 py-16 bg-card/20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-playfair text-3xl lg:text-4xl font-bold mb-6">
                UN LISTINO BEN FATTO NON È SOLO UNA 
                <span className="text-brand-fire"> TABELLA DI PREZZI</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                È uno strumento di marketing. Ti aiuta a:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-brand-fire rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <p className="text-muted-foreground">Farti percepire come una vera professionista</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-brand-fire rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <p className="text-muted-foreground">Comunicare il tuo valore senza doverlo giustificare</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-brand-fire rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <p className="text-muted-foreground">Vendere meglio, senza svenderti</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="bg-gradient-to-br from-brand-fire/10 to-brand-water/10 backdrop-blur-sm border-white/10 p-8 text-center">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-brand-fire/20 rounded-full flex items-center justify-center mx-auto">
                    <Play className="w-10 h-10 text-brand-fire" />
                  </div>
                  <h3 className="font-playfair text-2xl font-bold">È GRATUITO. È PRATICO.</h3>
                  <p className="text-muted-foreground">È pensato per te.</p>
                  <p className="text-sm text-muted-foreground">
                    📩 Riceverai immediatamente il link per guardarlo quando vuoi, dove vuoi.
                  </p>
                  <Button className="bg-brand-fire hover:bg-brand-fire/90 text-background px-8">
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
            <h2 className="font-playfair text-3xl lg:text-4xl font-bold mb-4">CHI SIAMO</h2>
            <div className="w-24 h-1 bg-brand-fire mx-auto"></div>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/30 backdrop-blur-sm border-white/10 p-8 lg:p-12">
              <div className="space-y-6 text-center">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  <strong className="text-brand-fire">4 Elementi Italia</strong> è una realtà nata per trasformare i centri estetici e i professionisti del beauty in vere imprese consapevoli. Con oltre <strong className="text-foreground">10 anni di esperienza</strong> nel settore, uniamo formazione, strategia e strumenti digitali per supportare estetiste, parrucchieri e professionisti del benessere nel loro percorso di crescita.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Il nostro metodo è <strong className="text-foreground">personalizzato, pratico e accessibile</strong>. Crediamo che ogni centro debba avere una visione chiara, un'identità forte e una gestione organizzata.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Collaboriamo con brand d'eccellenza come <strong className="text-brand-fire">Tokio, Nee Make Up Milano ed Everlinespa</strong>, per garantire qualità, innovazione e prestigio.
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
            <h2 className="font-playfair text-3xl lg:text-4xl font-bold mb-4">I NOSTRI SERVIZI</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tutto quello che serve per trasformare il tuo centro estetico in una vera impresa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-8">
              <div className="w-16 h-16 bg-brand-fire/20 rounded-full flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-brand-fire" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4">FORMAZIONE STRATEGICA</h3>
              <p className="text-muted-foreground">Per diventare imprenditori nel beauty</p>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-8">
              <div className="w-16 h-16 bg-brand-water/20 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-brand-water" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4">PIATTAFORMA DIGITALE</h3>
              <p className="text-muted-foreground">Con strumenti gestionali e supporto AI</p>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-8">
              <div className="w-16 h-16 bg-brand-earth/20 rounded-full flex items-center justify-center mb-6">
                <Headphones className="w-8 h-8 text-brand-earth" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4">CONSULENZE PERSONALIZZATE</h3>
              <p className="text-muted-foreground">Per organizzazione, listino, marketing e posizionamento</p>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-8">
              <div className="w-16 h-16 bg-brand-fire/20 rounded-full flex items-center justify-center mb-6">
                <Play className="w-8 h-8 text-brand-fire" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4">VIDEO CORSI</h3>
              <p className="text-muted-foreground">E materiali pratici da applicare subito nel tuo centro</p>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-8">
              <div className="w-16 h-16 bg-brand-water/20 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-brand-water" />
              </div>
              <h3 className="font-playfair text-xl font-bold mb-4">COMMUNITY ESCLUSIVA</h3>
              <p className="text-muted-foreground">Per confrontarti con altri professionisti e crescere insieme</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="contact" className="relative z-10 px-4 py-16">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="font-playfair text-3xl lg:text-4xl font-bold">
              TRASFORMA IL TUO CENTRO ESTETICO IN UNA 
              <span className="text-brand-fire"> VERA IMPRESA</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Se vuoi trasformare il tuo centro estetico in una vera impresa, sei nel posto giusto. ✨
            </p>
            <div className="space-y-4">
              <p className="text-lg font-semibold">Ti aspetto dall'altra parte!</p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Davide</strong> – Fondatore di 4 Elementi Italia
              </p>
            </div>
            <Button size="lg" className="bg-brand-fire hover:bg-brand-fire/90 text-background px-12 py-6 text-lg">
              <Play className="w-6 h-6 mr-3" />
              ACCEDI AL VIDEO GRATUITO
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-8 border-t border-white/10">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-brand-fire rounded-full flex items-center justify-center">
              <span className="text-background font-bold text-sm">4E</span>
            </div>
            <span className="font-playfair font-bold text-xl">4 ELEMENTI ITALIA</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 4 Elementi Italia. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;