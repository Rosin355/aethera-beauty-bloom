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

const ROLE_CHECK_TIMEOUT_MS = 4000;
const ROLE_CHECK_TIMEOUT = Symbol("role-check-timeout");

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFlags, setRoleFlags] = useState<RoleFlags>(defaultRoleFlags);

  const checkUserRoles = useCallback(async (userId: string) => {
    try {
      const rolePromise = fetchUserRoleFlags(userId);
      const timeoutPromise = new Promise<typeof ROLE_CHECK_TIMEOUT>((resolve) => {
        setTimeout(() => resolve(ROLE_CHECK_TIMEOUT), ROLE_CHECK_TIMEOUT_MS);
      });

      const result = await Promise.race([rolePromise, timeoutPromise]);
      if (result === ROLE_CHECK_TIMEOUT) {
        if (import.meta.env.DEV) {
          console.warn("[useAuth] role check timeout, defaulting to non-admin/non-collaborator");
        }
        setRoleFlags(defaultRoleFlags);
        return defaultRoleFlags;
      }

      setRoleFlags(result);
      return result;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[useAuth] role check error, defaulting to non-admin/non-collaborator", error);
      }
      setRoleFlags(defaultRoleFlags);
      return defaultRoleFlags;
    }
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
    if (import.meta.env.DEV) {
      console.debug("[useAuth] hydration start");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return;
        try {
          if (import.meta.env.DEV) {
            console.debug("[useAuth] onAuthStateChange", { hasSession: !!currentSession });
          }
          await syncSessionState(currentSession);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn("[useAuth] onAuthStateChange hydrate error", error);
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }
    );

    supabase.auth.getSession()
      .then(async ({ data: { session: currentSession } }) => {
        if (!mounted) return;
        try {
          if (import.meta.env.DEV) {
            console.debug("[useAuth] getSession resolved", { hasSession: !!currentSession });
          }
          await syncSessionState(currentSession);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn("[useAuth] getSession hydrate error", error);
          }
        } finally {
          if (mounted) {
            setLoading(false);
            if (import.meta.env.DEV) {
              console.debug("[useAuth] hydration end");
            }
          }
        }
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn("[useAuth] getSession failed", error);
        }
        if (mounted) {
          setRoleFlags(defaultRoleFlags);
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

    try {
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
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        setUser(null);
        setSession(null);
        setRoleFlags(defaultRoleFlags);
        toast.success("Disconnesso con successo");
      }
      return { error };
    } finally {
      setLoading(false);
    }
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
