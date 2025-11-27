
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
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
        toast.success("Bentornato!");
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
    <div className="glass-strong rounded-lg p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-playfair">
          {type === "login" ? "Bentornato" : "Crea Account"}
        </h1>
        <p className="text-muted-foreground mt-2">
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
              className=""
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
            className=""
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            {type === "login" && (
              <Link
                to="/forgot-password"
                className="text-sm text-accent hover:underline"
              >
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
            className=""
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
              <Link to="/terms" className="text-accent hover:underline">
                Termini di Servizio
              </Link>{" "}
              e la{" "}
              <Link to="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
        )}

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
        <p className="text-muted-foreground">
          {type === "login" ? "Non hai un account?" : "Hai già un account?"}
          <Link
            to={type === "login" ? "/signup" : "/login"}
            className="ml-1 text-accent hover:underline font-medium"
          >
            {type === "login" ? "Registrati" : "Accedi"}
          </Link>
        </p>
        {type === "login" && (
          <p className="text-muted-foreground text-sm">
            Hai perso l'email di accesso?{' '}
            <Link
              to="/recupera-accesso"
              className="text-[#6AA8B3] hover:text-[#6AA8B3]/80 hover:underline font-medium"
            >
              Recupera qui
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <Button
          variant="outline"
          className="w-full mb-3"
          type="button"
        >
          <svg
            className="w-5 h-5 mr-2"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
          </svg>
          Continua con Google
        </Button>

        <Button
          variant="outline"
          className="w-full"
          type="button"
        >
          <svg
            className="w-5 h-5 mr-2"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19.154 11.605c-.309-2.917-3.037-4.971-6.035-4.971-2.336 0-4.385 1.272-5.418 3.154C5.289 10.123 3 12.661 3 15.693c0 3.321 2.657 6 5.928 6h9.144c2.746 0 4.928-2.232 4.928-5a5.005 5.005 0 0 0-3.846-5.088z" />
          </svg>
          Continua con Apple
        </Button>
      </div>
    </div>
  );
};

export default AuthForm;
