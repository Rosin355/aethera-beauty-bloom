import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { logSecurityAuditEvent } from "@/lib/auth/authHelpers";

export const useSecureAuth = () => {
  const auth = useAuth();
  const { user, signOut: baseSignOut } = auth;

  const logSecurityEvent = useCallback(
    async (action: string, resource: string) => {
      if (!user) return;
      await logSecurityAuditEvent(user.id, action, resource);
    },
    [user]
  );

  const signOut = useCallback(async () => {
    if (user) {
      await logSecurityEvent("SIGN_OUT", "AUTH");
    }
    return baseSignOut();
  }, [user, baseSignOut, logSecurityEvent]);

  return {
    ...auth,
    signOut,
    logSecurityEvent,
  };
};
