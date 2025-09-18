import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Glow } from "@/components/ui/glow";
import { Check, ArrowLeft, Users } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getVideoUrl, checkVideoExists } from '@/lib/videoStorage';

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
  const [useIframeFull, setUseIframeFull] = useState(true);
  const [fullVideoUrl, setFullVideoUrl] = useState<string>('');

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
        
        // Initialize video URL
        const exists = await checkVideoExists('video-completo.mp4');
        if (exists) {
          setFullVideoUrl(getVideoUrl('video-completo.mp4'));
          setUseIframeFull(false);
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
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert([{
          email: newsletterForm.email.trim(),
          name: newsletterForm.name.trim() || null,
          mailing_list_id: mailingListData?.id
        }]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Già iscritto",
            description: "Sei già iscritto alla nostra newsletter!",
            variant: "default"
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Iscrizione completata!",
        description: "Ti terremo aggiornato sui nostri nuovi contenuti e servizi.",
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
                {fullVideoUrl && !useIframeFull ? (
                  <video 
                    controls 
                    preload="metadata"
                    className="w-full h-full"
                    style={{ backgroundColor: '#000' }}
                    onLoadStart={() => console.log('Video Completo: Load started')}
                    onCanPlay={() => console.log('Video Completo: Can play')}
                    onError={(e) => { console.error('Video Completo error:', e); setUseIframeFull(true); }}
                    onLoadedMetadata={() => console.log('Video Completo: Metadata loaded')}
                  >
                    <source src={fullVideoUrl} type="video/mp4" />
                    Il tuo browser non supporta il tag video.
                  </video>
                ) : (
                  <iframe
                    src="https://drive.google.com/file/d/1d2LJ8HRZ6sC-Pnp-CUDZJhhXLgr4gtHR/preview"
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title="Video completo"
                    style={{ backgroundColor: '#000' }}
                  />
                )}
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