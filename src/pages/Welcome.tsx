import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Glow } from "@/components/ui/glow";
import { Check, ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
                {useIframeFull ? (
                  <iframe
                    src="https://drive.google.com/file/d/1d2LJ8HRZ6sC-Pnp-CUDZJhhXLgr4gtHR/preview"
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title="Video completo"
                    style={{ backgroundColor: '#000' }}
                  />
                ) : (
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
                    <source src="/video-completo.mp4" type="video/mp4" />
                    Il tuo browser non supporta il tag video.
                  </video>
                )}
              </div>
            </Card>
          </div>

          {/* Newsletter Section */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="font-playfair text-2xl lg:text-3xl font-bold mb-6">
                Non perderti i nostri <span className="gradient-text">contenuti esclusivi</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="text-muted-foreground">Tips settimanali per il tuo business</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="text-muted-foreground">Accesso anticipato ai nuovi corsi</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="text-muted-foreground">Strategie e strumenti pratici</p>
                </div>
              </div>
            </div>

            <Card className="bg-card/30 backdrop-blur-sm border-white/10 p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-playfair text-xl font-bold mb-2">
                    Iscriviti alla Newsletter
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Unisciti alla community di estetiste professioniste
                  </p>
                </div>
                
                <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                  <Input 
                    placeholder="Il tuo nome" 
                    value={newsletterForm.name} 
                    onChange={(e) => setNewsletterForm({
                      ...newsletterForm,
                      name: e.target.value
                    })} 
                    className="bg-background/50 border-white/20" 
                  />
                  <Input 
                    type="email" 
                    placeholder="La tua email" 
                    value={newsletterForm.email} 
                    onChange={(e) => setNewsletterForm({
                      ...newsletterForm,
                      email: e.target.value
                    })} 
                    className="bg-background/50 border-white/20" 
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmittingNewsletter}
                    className="w-full"
                  >
                    {isSubmittingNewsletter ? "ISCRIZIONE IN CORSO..." : "ISCRIVITI ALLA NEWSLETTER"}
                  </Button>
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