import { useCallback, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import { getAuthRedirectUrl } from "@/lib/supabaseConfig";
import { toast } from "sonner";
import { fetchUserRoleFlags, type RoleFlags } from "@/lib/auth/authHelpers";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
}

const defaultRoleFlags: RoleFlags = {
  isAdmin: false,
  isCollaborator: false,
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFlags, setRoleFlags] = useState<RoleFlags>(defaultRoleFlags);

  const checkUserRoles = useCallback(async (userId: string) => {
    const nextFlags = await fetchUserRoleFlags(userId);
    setRoleFlags(nextFlags);
    return nextFlags;
  }, []);

  const syncSessionState = useCallback(
    async (nextSession: Session | null) => {
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setRoleFlags(defaultRoleFlags);
        return;
      }

      await checkUserRoles(nextUser.id);
    },
    [checkUserRoles]
  );

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return;
        await syncSessionState(currentSession);
        if (mounted) {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      await syncSessionState(currentSession);
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncSessionState]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    
    const redirectUrl = getAuthRedirectUrl("/dashboard");
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email
        }
      }
    });

    setLoading(false);
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.signOut();
    
    if (!error) {
      setUser(null);
      setSession(null);
      setRoleFlags(defaultRoleFlags);
      toast.success("Disconnesso con successo");
    }
    
    setLoading(false);
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = getAuthRedirectUrl("/reset-password");
    console.log('Reset password redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    return { error };
  };

  return {
    user,
    session,
    loading,
    isAdmin: roleFlags.isAdmin,
    isCollaborator: roleFlags.isCollaborator,
    signUp,
    signIn,
    signOut,
    resetPassword,
    checkUserRoles
  };
};
