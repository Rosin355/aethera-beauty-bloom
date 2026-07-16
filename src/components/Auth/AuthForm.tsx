
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AuthFormProps {
  type: "login" | "signup";
}

const AuthForm = ({ type }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { signUp, signIn, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (type === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email o password non corretti");
          } else {
            toast.error("Errore durante l'accesso: " + error.message);
          }
          return;
        }
        toast.success("Bentornata!");
        navigate("/dashboard");
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("Questo indirizzo email è già registrato");
          } else {
            toast.error("Errore durante la registrazione: " + error.message);
          }
          return;
        }
        toast.success("Account creato! Controlla la tua email per confermare l'account.");
        navigate("/onboarding");
      }
    } catch (error) {
      toast.error("Si è verificato un errore imprevisto");
      console.error("Auth error:", error);
    }
  };

  return (
    <div className="glass-card rounded-[28px] border border-white/10 p-8 sm:p-10 w-full max-w-[440px]">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-3">
          <span className="eyebrow-line" aria-hidden="true" />
          <span className="eyebrow">4 Elementi Italia</span>
          <span className="eyebrow-line" aria-hidden="true" />
        </span>
        <h1 className="font-playfair text-4xl mt-4">
          {type === "login" ? "Bentornata" : "Crea Account"}
        </h1>
        <p className="text-muted-foreground text-sm mt-3">
          {type === "login"
            ? "Inserisci le tue credenziali per accedere al tuo account"
            : "Inserisci i tuoi dati per creare un account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Inserisci il tuo nome completo"
              required
              autoComplete="name"
              className="input-glass h-12 rounded-xl"
            />
          </div>
        )}

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

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            {type === "login" && (
              <Link to="/forgot-password" className="link-quiet text-sm">
                Password dimenticata?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={
              type === "login" ? "Inserisci la tua password" : "Crea una password"
            }
            required
            autoComplete={type === "login" ? "current-password" : "new-password"}
            className="input-glass h-12 rounded-xl"
          />
        </div>

        {type === "signup" && (
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox id="terms" />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Accetto i{" "}
              <a
                href="https://www.iubenda.com/termini-e-condizioni/19385152"
                target="_blank"
                rel="noopener noreferrer"
                className="link-cyan"
              >
                Termini di Servizio
              </a>{" "}
              e la{" "}
              <a
                href="https://www.iubenda.com/privacy-policy/19385152"
                target="_blank"
                rel="noopener noreferrer"
                className="link-cyan"
              >
                Privacy Policy
              </a>
            </label>
          </div>
        )}

        <Button type="submit" size="pill" className="w-full mt-6" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {type === "login" ? "Accesso in corso..." : "Creazione account in corso..."}
            </>
          ) : type === "login" ? (
            "Accedi"
          ) : (
            "Crea Account"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center space-y-3">
        <p className="text-muted-foreground text-sm">
          {type === "login" ? "Non hai un account?" : "Hai già un account?"}
          <Link
            to={type === "login" ? "/signup" : "/login"}
            className="ml-1 link-quiet font-medium"
          >
            {type === "login" ? "Registrati" : "Accedi"}
          </Link>
        </p>
        {type === "login" && (
          <p className="text-muted-foreground text-sm">
            Hai perso l'email di accesso?{" "}
            <Link to="/recupera-accesso" className="link-quiet font-medium">
              Recupera qui
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
