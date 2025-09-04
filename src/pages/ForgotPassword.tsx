import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Logo from "@/components/Layout/Logo";
import { ArrowLeft, Mail } from "lucide-react";

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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4">
        <Logo />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="glass-strong rounded-lg p-8 w-full max-w-md">
          {!emailSent ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold font-playfair">Password Dimenticata</h1>
                <p className="text-muted-foreground mt-2">
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
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-green-600" size={32} />
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
                variant="outline"
                className="mb-4"
              >
                Invia Nuovamente
              </Button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-accent hover:underline font-medium"
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