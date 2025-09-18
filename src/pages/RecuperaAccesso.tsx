import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Glow } from "@/components/ui/glow";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const RecuperaAccesso = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email richiesta",
        description: "Inserisci la tua email per recuperare l'accesso",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Controlla se l'email esiste nella mailing list
      const { data, error } = await supabase
        .from('mailing_list')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (error || !data) {
        toast({
          title: "Email non trovata",
          description: "L'email inserita non è presente nella nostra lista. Assicurati di aver inserito l'email corretta.",
          variant: "destructive"
        });
        return;
      }

      // TODO: Qui chiameremo l'edge function per inviare l'email quando sarà configurato Resend
      // Per ora mostriamo solo un messaggio di successo simulato
      toast({
        title: "Link inviato! (simulazione)",
        description: `Il link di accesso è stato inviato a ${email}. Controlla la tua casella email.`,
      });

      // Reset form
      setEmail('');
      
    } catch (error) {
      console.error('Errore recupero accesso:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio. Riprova più tardi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Main Content */}
      <section className="relative z-10 px-4 py-16">
        <div className="container mx-auto max-w-md">
          <Card className="bg-card/30 backdrop-blur-sm border-white/10 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-playfair text-2xl font-bold mb-2">
                Recupera l'accesso
              </h1>
              <p className="text-muted-foreground">
                Inserisci la tua email per ricevere il link di accesso alla pagina riservata
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-foreground text-sm font-medium mb-2">
                  Email *
                </label>
                <Input 
                  type="email" 
                  placeholder="la.tua.email@esempio.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-white/20 h-12" 
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  "Invia link di accesso"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Non hai ancora un account?{' '}
                <Button 
                  variant="link" 
                  onClick={() => navigate('/landing')}
                  className="p-0 h-auto text-primary hover:text-primary/80"
                >
                  Iscriviti qui
                </Button>
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 py-8 border-t border-white/10 mt-auto">
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

export default RecuperaAccesso;