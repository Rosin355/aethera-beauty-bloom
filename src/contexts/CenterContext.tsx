import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bindPendingInvites, type CenterRole } from "@/lib/api/centers";

interface CenterContextValue {
  centerId: string | null;
  centerName: string | null;
  role: CenterRole | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const CenterContext = createContext<CenterContextValue>({
  centerId: null,
  centerName: null,
  role: null,
  loading: true,
  refresh: async () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useCenter = () => useContext(CenterContext);

export const CenterProvider = ({ children }: { children: ReactNode }) => {
  const [centerId, setCenterId] = useState<string | null>(null);
  const [centerName, setCenterName] = useState<string | null>(null);
  const [role, setRole] = useState<CenterRole | null>(null);
  const [loading, setLoading] = useState(true);

  const resolve = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        setCenterId(null);
        setCenterName(null);
        setRole(null);
        return;
      }

      // Claim any invite addressed to this user's email before resolving membership.
      await bindPendingInvites();

      // v1: first active membership. Center switching UI comes later.
      const { data: membership } = await supabase
        .from("center_members")
        .select("center_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!membership) {
        setCenterId(null);
        setCenterName(null);
        setRole(null);
        return;
      }

      setCenterId(membership.center_id);
      setRole(membership.role as CenterRole);

      const { data: center } = await supabase
        .from("centers")
        .select("name")
        .eq("id", membership.center_id)
        .maybeSingle();
      setCenterName(center?.name ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    resolve();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      resolve();
    });
    return () => sub.subscription.unsubscribe();
  }, [resolve]);

  return (
    <CenterContext.Provider value={{ centerId, centerName, role, loading, refresh: resolve }}>
      {children}
    </CenterContext.Provider>
  );
};
