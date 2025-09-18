import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GlowCard } from "@/components/ui/spotlight-card";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Check, Play, Users, Award, BookOpen, Headphones } from "lucide-react";
import { Glow } from "@/components/ui/glow";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getVideoUrl, checkVideoExists } from "@/lib/videoStorage";
const LandingPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [useIframePreview, setUseIframePreview] = useState(true);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>('');

  useEffect(() => {
    const initializeVideo = async () => {
      const exists = await checkVideoExists('video-anteprima.mp4');
      if (exists) {
        setPreviewVideoUrl(getVideoUrl('video-anteprima.mp4'));
        setUseIframePreview(false);
      }
    };
    
    initializeVideo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci nome e email per continuare",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('mailing_list')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.trim(),
          source: 'landing_page'
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Email già registrata",
            description: "Questa email è già registrata. Controlla la tua casella per il link al video.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      // Redirect to welcome page with token
      if (data?.access_token) {
        window.location.href = `/welcome?token=${data.access_token}`;
      }

    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova tra qualche minuto.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
                <h1 className="font-playfair text-4xl lg:text-6xl font-bold leading-tight text-white">
                  SEI UN'ESTETISTA
                  <span className="gradient-text"> PROFESSIONISTA?</span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
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

              <Button 
                size="lg" 
                className="bg-white hover:bg-gray-200 text-black px-8 py-6 text-lg font-medium"
                onClick={() => document.getElementById('video-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              >
                <Play className="w-5 h-5 mr-2" />
                ACCEDI AL VIDEO GRATUITO
              </Button>
            </div>

            <div className="relative space-y-6">
              {/* Video Anteprima */}
              <div className="w-full aspect-video bg-card/30 backdrop-blur-sm border-white/10 border rounded-lg overflow-hidden">
                {previewVideoUrl && !useIframePreview ? (
                  <video 
                    controls 
                    preload="metadata"
                    className="w-full h-full"
                    style={{ backgroundColor: '#000' }}
                    onLoadStart={() => console.log('Video: Load started')}
                    onCanPlay={() => console.log('Video: Can play')}
                    onError={(e) => { console.error('Video error:', e); setUseIframePreview(true); }}
                    onLoadedMetadata={() => console.log('Video: Metadata loaded')}
                  >
                    <source src={previewVideoUrl} type="video/mp4" />
                    Il tuo browser non supporta il tag video.
                  </video>
                ) : (
                  <iframe
                    src="https://drive.google.com/file/d/1uUjhPnxnqhI7YuYlgUBECX0D4Umzd-X_/preview"
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title="Video anteprima"
                    style={{ backgroundColor: '#000' }}
                  />
                )}
              </div>
              
              <Card id="video-form" className="bg-card/50 backdrop-blur-sm border-white/10 p-8">
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
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-white hover:bg-gray-200 text-black font-medium"
                    >
                      {isSubmitting ? "INVIO IN CORSO..." : "RICEVI IL VIDEO GRATUITO"}
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

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            <GlowCard glowColor="orange" customSize className="w-full p-8 text-center flex flex-col">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <h3 className="font-playfair text-xl font-bold text-white text-center leading-tight mb-4">CALCOLO DEL<br />COSTO ORARIO</h3>
                <p className="text-muted-foreground text-center leading-relaxed text-sm">
                  Come organizzare il tuo listino in modo strategico (anche se non sei brava con i numeri o il marketing)
                </p>
              </div>
            </GlowCard>

            <GlowCard glowColor="blue" customSize className="w-full p-8 text-center flex flex-col">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <h3 className="font-playfair text-xl font-bold text-white text-center leading-tight mb-4">CALCOLO DEL<br />PRODOTTO</h3>
                <p className="text-muted-foreground text-center leading-relaxed text-sm">
                  Cosa scrivere per trasmettere professionalità e farti scegliere dai tuoi clienti
                </p>
              </div>
            </GlowCard>

            <GlowCard glowColor="green" customSize className="w-full p-8 text-center flex flex-col">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <h3 className="font-playfair text-xl font-bold text-white text-center leading-tight mb-4">CALCOLO DEL<br />MARGINE OPERATIVO</h3>
                <p className="text-muted-foreground text-center leading-relaxed text-sm">
                  La Formula Per Valutare Il Prezzo Giusto
                </p>
              </div>
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
                  <Button 
                    className="bg-white hover:bg-gray-200 text-black px-8 font-medium"
                    onClick={() => document.getElementById('video-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  >
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
        <style>
          {`
            .service-card-fuoco [data-glow] {
              --base: 24 !important;
              --saturation: 100 !important;
              --lightness: 60 !important;
            }
            .service-card-fuoco [data-glow]:before {
              background-image: radial-gradient(
                calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
                calc(var(--x, 0) * 1px)
                calc(var(--y, 0) * 1px),
                hsl(24 100% 50% / 0.8), transparent 100%
              ) !important;
            }
            .service-card-fuoco [data-glow]:after {
              background-image: radial-gradient(
                calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
                calc(var(--x, 0) * 1px)
                calc(var(--y, 0) * 1px),
                hsl(24 100% 70% / 1), transparent 100%
              ) !important;
            }
            
            .service-card-terra [data-glow] {
              --base: 142 !important;
              --saturation: 70 !important;
              --lightness: 45 !important;
            }
            .service-card-terra [data-glow]:before {
              background-image: radial-gradient(
                calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
                calc(var(--x, 0) * 1px)
                calc(var(--y, 0) * 1px),
                hsl(142 70% 40% / 0.8), transparent 100%
              ) !important;
            }
            .service-card-terra [data-glow]:after {
              background-image: radial-gradient(
                calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
                calc(var(--x, 0) * 1px)
                calc(var(--y, 0) * 1px),
                hsl(142 70% 60% / 1), transparent 100%
              ) !important;
            }
            
            .service-card-aria [data-glow] {
              --base: 200 !important;
              --saturation: 80 !important;
              --lightness: 60 !important;
            }
            .service-card-aria [data-glow]:before {
              background-image: radial-gradient(
                calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
                calc(var(--x, 0) * 1px)
                calc(var(--y, 0) * 1px),
                hsl(200 80% 55% / 0.8), transparent 100%
              ) !important;
            }
            .service-card-aria [data-glow]:after {
              background-image: radial-gradient(
                calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
                calc(var(--x, 0) * 1px)
                calc(var(--y, 0) * 1px),
                hsl(200 80% 75% / 1), transparent 100%
              ) !important;
            }
            
            .service-card-acqua [data-glow] {
              --base: 220 !important;
              --saturation: 90 !important;
              --lightness: 55 !important;
            }
            .service-card-acqua [data-glow]:before {
              background-image: radial-gradient(
                calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
                calc(var(--x, 0) * 1px)
                calc(var(--y, 0) * 1px),
                hsl(220 90% 50% / 0.8), transparent 100%
              ) !important;
            }
            .service-card-acqua [data-glow]:after {
              background-image: radial-gradient(
                calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
                calc(var(--x, 0) * 1px)
                calc(var(--y, 0) * 1px),
                hsl(220 90% 70% / 1), transparent 100%
              ) !important;
            }

            /* Icon Circle Glow Effects */
            .icon-circle-fuoco {
              border: 2px solid hsl(24 100% 60% / 0.3);
              box-shadow: 0 0 20px hsl(24 100% 60% / 0.4), inset 0 0 20px hsl(24 100% 60% / 0.1);
              transition: all 0.3s ease;
            }
            .icon-circle-fuoco:hover {
              border-color: hsl(24 100% 60% / 0.6);
              box-shadow: 0 0 30px hsl(24 100% 60% / 0.6), inset 0 0 30px hsl(24 100% 60% / 0.2);
            }

            .icon-circle-terra {
              border: 2px solid hsl(142 70% 45% / 0.3);
              box-shadow: 0 0 20px hsl(142 70% 45% / 0.4), inset 0 0 20px hsl(142 70% 45% / 0.1);
              transition: all 0.3s ease;
            }
            .icon-circle-terra:hover {
              border-color: hsl(142 70% 45% / 0.6);
              box-shadow: 0 0 30px hsl(142 70% 45% / 0.6), inset 0 0 30px hsl(142 70% 45% / 0.2);
            }

            .icon-circle-aria {
              border: 2px solid hsl(200 80% 60% / 0.3);
              box-shadow: 0 0 20px hsl(200 80% 60% / 0.4), inset 0 0 20px hsl(200 80% 60% / 0.1);
              transition: all 0.3s ease;
            }
            .icon-circle-aria:hover {
              border-color: hsl(200 80% 60% / 0.6);
              box-shadow: 0 0 30px hsl(200 80% 60% / 0.6), inset 0 0 30px hsl(200 80% 60% / 0.2);
            }

            .icon-circle-acqua {
              border: 2px solid hsl(220 90% 55% / 0.3);
              box-shadow: 0 0 20px hsl(220 90% 55% / 0.4), inset 0 0 20px hsl(220 90% 55% / 0.1);
              transition: all 0.3s ease;
            }
            .icon-circle-acqua:hover {
              border-color: hsl(220 90% 55% / 0.6);
              box-shadow: 0 0 30px hsl(220 90% 55% / 0.6), inset 0 0 30px hsl(220 90% 55% / 0.2);
            }
          `}
        </style>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-3xl lg:text-4xl font-bold mb-4 text-white">I NOSTRI SERVIZI</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tutto quello che serve per trasformare il tuo centro estetico in una vera impresa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="service-card-fuoco">
              <GlowCard customSize className="w-full p-8 text-center aspect-auto h-auto min-h-[320px] flex flex-col">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 icon-circle-fuoco">
                    <div className="text-white text-2xl font-bold">△</div>
                  </div>
                  <div className="h-16 flex items-center justify-center">
                    <h3 className="font-playfair text-xl font-bold text-white text-center">FUOCO</h3>
                  </div>
                </div>
                <div className="h-20 flex items-start justify-center mt-4">
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">Piattaforma 4 Elementi Italia Srl e consulenza.</p>
                </div>
              </GlowCard>
            </div>

            <div className="service-card-terra">
              <GlowCard customSize className="w-full p-8 text-center aspect-auto h-auto min-h-[320px] flex flex-col">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 icon-circle-terra">
                    <div className="text-white text-xl font-bold relative">
                      <div>▽</div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-white"></div>
                    </div>
                  </div>
                  <div className="h-16 flex items-center justify-center">
                    <h3 className="font-playfair text-xl font-bold text-white text-center">TERRA</h3>
                  </div>
                </div>
                <div className="h-20 flex items-center justify-center mt-4">
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">Azienda riqualificazione centro estetico, restyling arredamento e sistema operativo.</p>
                </div>
              </GlowCard>
            </div>

            <div className="service-card-aria">
              <GlowCard customSize className="w-full p-8 text-center aspect-auto h-auto min-h-[320px] flex flex-col">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 icon-circle-aria">
                    <div className="text-white text-xl font-bold relative">
                      <div>△</div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-white"></div>
                    </div>
                  </div>
                  <div className="h-16 flex items-center justify-center">
                    <h3 className="font-playfair text-xl font-bold text-white text-center">ARIA</h3>
                  </div>
                </div>
                <div className="h-20 flex items-start justify-center mt-4">
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">Marketing specifico per settore beauty.</p>
                </div>
              </GlowCard>
            </div>

            <div className="service-card-acqua">
              <GlowCard customSize className="w-full p-8 text-center aspect-auto h-auto min-h-[320px] flex flex-col">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 icon-circle-acqua">
                    <div className="text-white text-2xl font-bold">▽</div>
                  </div>
                  <div className="h-16 flex items-center justify-center">
                    <h3 className="font-playfair text-xl font-bold text-white text-center">ACQUA</h3>
                  </div>
                </div>
                <div className="h-20 flex items-center justify-center mt-4">
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">Partnership con Tokyo Top Air, Nee Make Up Milano e EvertlinerSpa.</p>
                </div>
              </GlowCard>
            </div>
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
            <Button 
              size="lg" 
              className="bg-white hover:bg-gray-200 text-black px-12 py-6 text-lg font-medium"
              onClick={() => document.getElementById('video-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
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