import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const ADMIN_BOOTSTRAP_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN_BOOTSTRAP === "true";

const ALLOWED_BOOTSTRAP_DOMAINS = (
  import.meta.env.VITE_ADMIN_BOOTSTRAP_ALLOWED_DOMAINS ?? ""
)
  .split(",")
  .map((domain: string) => domain.trim().toLowerCase())
  .filter(Boolean);

const BecomeAdminButton = () => {
  const { user } = useAuth();
  const [hasAdmin, setHasAdmin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    if (!ADMIN_BOOTSTRAP_ENABLED) {
      setHasAdmin(true);
      setChecking(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (error) throw error;

      setHasAdmin((data?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking admin existence:', error);
    } finally {
      setChecking(false);
    }
  };

  const becomeAdmin = async () => {
    if (!user) return;

    if (!ADMIN_BOOTSTRAP_ENABLED) {
      toast.error("Bootstrap admin disabilitato in questo ambiente");
      return;
    }

    if (!user.email_confirmed_at) {
      toast.error("Conferma prima la tua email per diventare amministratore");
      return;
    }

    const userDomain = user.email?.split("@")[1]?.toLowerCase();
    if (
      ALLOWED_BOOTSTRAP_DOMAINS.length > 0 &&
      (!userDomain || !ALLOWED_BOOTSTRAP_DOMAINS.includes(userDomain))
    ) {
      toast.error("Questo account non è autorizzato al bootstrap admin");
      return;
    }

    setLoading(true);
    try {
      const { data: existingAdmin, error: adminCheckError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "admin")
        .limit(1);

      if (adminCheckError) throw adminCheckError;

      if ((existingAdmin?.length ?? 0) > 0) {
        setHasAdmin(true);
        toast.error("Un amministratore è già presente nel sistema");
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'admin' });

      if (error) throw error;

      toast.success("Sei diventato amministratore!");
      setHasAdmin(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes('RLS policy violation')) {
        toast.error("Non puoi diventare amministratore - esiste già un admin");
      } else {
        toast.error("Errore durante l'assegnazione del ruolo admin");
      }
      console.error('Error becoming admin:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show if checking, user not logged in, or admin already exists
  if (checking || !user || hasAdmin) {
    return null;
  }

  return (
    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Shield className="text-accent mt-1" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-accent mb-1">
            Nessun amministratore configurato
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Sembra che non ci siano ancora amministratori nel sistema. 
            Puoi diventare il primo amministratore per gestire la piattaforma.
          </p>
          <Button
            onClick={becomeAdmin}
            disabled={loading}
            size="sm"
            className="bg-accent hover:bg-accent/90"
          >
            {loading ? "Assegnazione..." : "Diventa Amministratore"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BecomeAdminButton;
