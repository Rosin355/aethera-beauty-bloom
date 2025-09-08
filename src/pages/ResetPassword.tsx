import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Layout/Logo";
import { Lock, Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const parseHashParams = () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      console.log('Hash params:', {
        hash,
        accessToken: params.get('access_token'),
        refreshToken: params.get('refresh_token'),
        type: params.get('type')
      });
      return {
        accessToken: params.get('access_token'),
        refreshToken: params.get('refresh_token'),
        type: params.get('type')
      };
    };

    const parseUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      console.log('URL params:', {
        accessToken: urlParams.get('access_token'),
        refreshToken: urlParams.get('refresh_token'),
        type: urlParams.get('type')
      });
      return {
        accessToken: urlParams.get('access_token'),
        refreshToken: urlParams.get('refresh_token'),
        type: urlParams.get('type')
      };
    };

    const handlePasswordReset = async () => {
      // Try both hash and URL params
      let tokens = parseHashParams();
      if (!tokens.accessToken || !tokens.refreshToken) {
        tokens = parseUrlParams();
      }
      
      const { accessToken, refreshToken, type } = tokens;
      console.log('Final tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
      
      if (accessToken && refreshToken && type === 'recovery') {
        try {
          console.log('Setting session with tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          console.log('Session result:', { data: !!data.session, error });

          if (error) {
            console.error('Session error:', error);
            toast.error("Link di reset non valido o scaduto: " + error.message);
            setTimeout(() => navigate('/forgot-password'), 2000);
          } else {
            console.log('Session set successfully');
            setValidSession(true);
            // Clear the hash and params from the URL
            window.history.replaceState(null, '', window.location.pathname);
          }
        } catch (error) {
          console.error('Catch error:', error);
          toast.error("Errore nel processare il link di reset");
          setTimeout(() => navigate('/forgot-password'), 2000);
        }
      } else {
        console.log('Missing tokens or wrong type');
        toast.error("Link di reset non valido o scaduto");
        setTimeout(() => navigate('/forgot-password'), 2000);
      }
      setSessionLoading(false);
    };

    handlePasswordReset();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }

    if (password.length < 6) {
      toast.error("La password deve essere di almeno 6 caratteri");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast.error("Errore durante l'aggiornamento della password: " + error.message);
        return;
      }

      toast.success("Password aggiornata con successo!");
      navigate('/dashboard');
    } catch (error) {
      toast.error("Si è verificato un errore imprevisto");
      console.error("Update password error:", error);
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
          {sessionLoading ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="animate-spin h-8 w-8 text-accent"
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
              </div>
              <h1 className="text-2xl font-bold font-playfair">Verificando il link...</h1>
              <p className="text-muted-foreground mt-2">Attendere prego</p>
            </div>
          ) : !validSession ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-destructive" size={32} />
              </div>
              <h1 className="text-2xl font-bold font-playfair">Link non valido</h1>
              <p className="text-muted-foreground mt-2 mb-6">
                Il link di reset è scaduto o non valido. Richiedi un nuovo link di reset.
              </p>
              <Link to="/forgot-password">
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Torna al Reset Password
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="text-accent" size={32} />
                </div>
                <h1 className="text-3xl font-bold font-playfair">Nuova Password</h1>
                <p className="text-muted-foreground mt-2">
                  Inserisci la tua nuova password per completare il recupero
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nuova Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Inserisci la nuova password"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Conferma Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Conferma la nuova password"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive">Le password non coincidono</p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-6"
                  disabled={loading || password !== confirmPassword || password.length < 6}
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
                      Aggiornamento...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Aggiorna Password
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  La password deve essere di almeno 6 caratteri
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;