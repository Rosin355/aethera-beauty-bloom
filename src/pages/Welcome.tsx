import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Glow } from "@/components/ui/glow";
import { Check, ArrowLeft, Users } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getVideoUrl } from '@/lib/videoStorage';
import { getSiteVideo, SiteVideo, getYouTubeEmbedUrl } from '@/lib/siteVideos';
import VideoPlayer from '@/components/ui/VideoPlayer';

const Welcome = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mailingListData, setMailingListData] = useState<any>(null);
  const [newsletterForm, setNewsletterForm] = useState({
    email: "",
    name: ""
  });
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const [fullVideo, setFullVideo] = useState<SiteVideo | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast({
          title: "Accesso non autorizzato",
          description: "Token di accesso mancante",
          variant: "destructive"
        });
        navigate('/landing');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('mailing_list')
          .select('*')
          .eq('access_token', token)
          .single();

        if (error || !data) {
          toast({
            title: "Token non valido",
            description: "Il link di accesso non è valido o è scaduto",
            variant: "destructive"
          });
          navigate('/landing');
          return;
        }

        setIsValidToken(true);
        setMailingListData(data);
        setNewsletterForm({ 
          email: data.email, 
          name: data.name 
        });
        
        // Load video from site_videos database
        const video = await getSiteVideo('full');
        if (video) {
          setFullVideo(video);
        }
      } catch (error) {
        console.error('Errore validazione token:', error);
        navigate('/landing');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token, navigate, toast]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterForm.email.trim()) {
      toast({
        title: "Email richiesta",
        description: "Inserisci la tua email per iscriverti alla newsletter",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingNewsletter(true);
    try {
      const response = await supabase.functions.invoke('newsletter-subscribe', {
        body: {
          email: newsletterForm.email.trim(),
          name: newsletterForm.name.trim() || null,
          mailing_list_id: mailingListData?.id
        }
      });

      if (response.error) {
        if (response.error.message?.includes('già iscritta')) {
          toast({
            title: "Già iscritto",
            description: "Sei già iscritto alla nostra newsletter!",
            variant: "default"
          });
        } else {
          throw new Error(response.error.message || 'Errore durante l\'iscrizione');
        }
        return;
      }

      toast({
        title: "Iscrizione completata!",
        description: "Ti terremo aggiornato sui nostri nuovi contenuti e servizi. Controlla la tua email!",
      });

      setNewsletterForm({ email: "", name: "" });

    } catch (error) {
      console.error('Errore iscrizione newsletter:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'iscrizione. Riprova.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifica accesso in corso...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return null; // Il componente gestisce già il redirect
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Glow variant="top" className="opacity-30" />
      
      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/4-elementi-logo.png" alt="4 Elementi Italia Logo" className="h-12 w-auto" />
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/landing')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Landing
          </Button>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="relative z-10 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="font-playfair text-3xl lg:text-5xl font-bold mb-4">
              Benvenuto/a <span className="gradient-text">{mailingListData?.name}</span>!
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Ecco il video completo che ti aiuterà a strutturare il tuo listino prezzi in modo strategico
            </p>
          </div>

          {/* Video Completo */}
          <div className="mb-12">
            <Card className="bg-card/30 backdrop-blur-sm border-white/10 p-4">
              <div className="aspect-video rounded-lg overflow-hidden">
                {fullVideo ? (
                  <VideoPlayer 
                    video={fullVideo}
                    className="w-full h-full"
                    fallbackLocalPath="/video-completo.mp4"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* PDF Download Section */}
          <div className="mb-12">
            <Card className="bg-card/20 backdrop-blur-sm border-white/10 p-8">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#E46A39] to-[#C2977E] rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-playfair text-2xl font-bold text-white">
                        Checklist Prezzo Perfetto
                      </h3>
                      <p className="text-[#6AA8B3] font-medium">La tua guida pratica per prezzi strategici</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-white text-lg leading-relaxed">
                      <strong>Ora che hai visto il video, è il momento di agire!</strong> Scarica la nostra checklist esclusiva per verificare punto per punto se i tuoi prezzi ti fanno davvero guadagnare.
                    </p>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
                      <h4 className="text-white font-semibold mb-3">📋 Cosa troverai nella checklist:</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {[
                          "✅ Come calcolare il tuo costo orario reale",
                          "✅ Analisi dei servizi più venduti e redditizi",
                          "✅ Formula corretta per applicare il margine",
                          "✅ Struttura del listino perfetto",
                          "✅ Come comunicare i prezzi con sicurezza"
                        ].map((item, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <span className="text-[#6AA8B3] mt-0.5">•</span>
                            <p className="text-white/90">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-[#E46A39] to-[#6AA8B3] rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  
                  <h4 className="font-playfair text-xl font-bold text-white mb-3">
                    Scarica Subito la Checklist
                  </h4>
                  <p className="text-white/80 text-sm mb-6">
                    Un PDF di 7 pagine per trasformare immediatamente la strategia dei tuoi prezzi
                  </p>
                  
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/Checklist_Prezzo_Perfetto_4_Elementi_Italia.pdf';
                      link.download = 'Checklist_Prezzo_Perfetto_4_Elementi_Italia.pdf';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full h-12 bg-gradient-to-r from-[#E46A39] to-[#6AA8B3] hover:from-[#E46A39]/80 hover:to-[#6AA8B3]/80 text-white font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    📥 SCARICA LA CHECKLIST GRATUITA
                  </Button>
                  
                  <p className="text-white/60 text-xs mt-3">
                    Formato PDF • 7 pagine • Pronta da stampare
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Newsletter Section */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                  Sta per arrivare qualcosa di grande.
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Iscriviti ora per non perderti il lancio ufficiale della piattaforma e accedere in anteprima alla community riservata ai professionisti del settore.
                </p>
              </div>
              
              <div className="space-y-4">
                {[
                  "Tips settimanali esclusivi per far crescere il tuo business",
                  "Strategie pratiche e strumenti pronti all'uso",
                  "Accesso anticipato a corsi, risorse e novità"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[#6AA8B3] rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-white text-lg">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-card/20 backdrop-blur-sm border-white/10 p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#6AA8B3]/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[#6AA8B3]" />
                  </div>
                  <h3 className="font-playfair text-2xl font-bold text-white mb-2">
                    👉 Iscriviti oggi. Sii tra i primi a entrare.
                  </h3>
                </div>

                <form onSubmit={handleNewsletterSubmit} className="space-y-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Nome *</label>
                    <Input 
                      placeholder="Il tuo nome" 
                      value={newsletterForm.name} 
                      onChange={(e) => setNewsletterForm({
                        ...newsletterForm,
                        name: e.target.value
                      })} 
                      className="bg-card/40 border-white/20 text-white placeholder:text-muted-foreground h-12" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Email *</label>
                    <Input 
                      type="email" 
                      placeholder="la.tua.email@esempio.com" 
                      value={newsletterForm.email} 
                      onChange={(e) => setNewsletterForm({
                        ...newsletterForm,
                        email: e.target.value
                      })} 
                      className="bg-card/40 border-white/20 text-white placeholder:text-muted-foreground h-12" 
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmittingNewsletter}
                    className="w-full h-12 bg-gradient-to-r from-[#6AA8B3] to-[#E46A39] hover:from-[#6AA8B3]/80 hover:to-[#E46A39]/80 text-white font-semibold text-sm transition-all duration-300"
                  >
                    {isSubmittingNewsletter ? "ISCRIZIONE IN CORSO..." : "ISCRIVITI ALLA NEWSLETTER"}
                  </Button>
                  <p className="text-center text-muted-foreground text-xs">
                    Rispettiamo la tua privacy. Nessuno spam, solo contenuti di valore.
                  </p>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-8 border-t border-white/10">
        <div className="container mx-auto text-center">
          <img src="/4-elementi-logo.png" alt="4 Elementi Italia" className="h-8 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            © 2024 4 Elementi Italia. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;