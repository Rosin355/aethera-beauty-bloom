import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Logo from "@/components/Layout/Logo";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast.error("Email non confermata. Controlla la tua casella email per confermare l'account.");
        } else if (error.message.includes("User not found")) {
          toast.error("Nessun account trovato con questa email.");
        } else {
          toast.error("Errore durante l'invio dell'email: " + error.message);
        }
        return;
      }

      setEmailSent(true);
      toast.success("Email di recupero inviata! Controlla la tua casella email.");
    } catch (error) {
      toast.error("Si è verificato un errore imprevisto");
      console.error("Reset password error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="page-glow" aria-hidden="true" />
      <div className="p-4 relative z-[1]">
        <Logo />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 relative z-[1]">
        <div className="glass-card rounded-[28px] border border-white/10 p-8 sm:p-10 w-full max-w-[440px]">
          {!emailSent ? (
            <>
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-3">
                  <span className="eyebrow-line" aria-hidden="true" />
                  <span className="eyebrow">4 Elementi Italia</span>
                  <span className="eyebrow-line" aria-hidden="true" />
                </span>
                <h1 className="font-playfair text-3xl mt-4">Password Dimenticata</h1>
                <p className="text-muted-foreground text-sm mt-3">
                  Inserisci la tua email e ti invieremo un link per reimpostare la password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Indirizzo Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Inserisci la tua email"
                    required
                    autoComplete="email"
                    className="input-glass h-12 rounded-xl"
                  />
                </div>

                <Button type="submit" size="pill" className="w-full mt-6" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      Invio in corso...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Invia Link di Recupero
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-success" size={32} />
              </div>
              <h1 className="text-2xl font-bold font-playfair mb-2">Email Inviata!</h1>
              <p className="text-muted-foreground mb-6">
                Abbiamo inviato un link di recupero password a <strong>{email}</strong>. 
                Controlla la tua casella email e segui le istruzioni per reimpostare la password.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Non hai ricevuto l'email? Controlla la cartella spam o prova a inviare nuovamente.
              </p>
              <Button
                onClick={() => setEmailSent(false)}
                variant="secondary"
                size="pill"
                className="mb-4"
              >
                Invia Nuovamente
              </Button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm link-quiet font-medium"
            >
              <ArrowLeft size={16} className="mr-1" />
              Torna al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;