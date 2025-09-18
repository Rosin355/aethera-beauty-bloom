import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SecureAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
}

export const useSecureAuth = () => {
  const [state, setState] = useState<SecureAuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
    isCollaborator: false,
  });

  const checkUserRoles = async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking user roles:', error);
        return { isAdmin: false, isCollaborator: false };
      }

      const userRoles = roles?.map(r => r.role) || [];
      return {
        isAdmin: userRoles.includes('admin'),
        isCollaborator: userRoles.includes('collaborator'),
      };
    } catch (error) {
      console.error('Error in checkUserRoles:', error);
      return { isAdmin: false, isCollaborator: false };
    }
  };

  const logSecurityEvent = async (action: string, resource: string) => {
    if (!state.user) return;
    
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: state.user.id,
          action,
          resource,
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({ ...prev, session, user: session?.user ?? null }));

        if (session?.user) {
          // Defer role checking to avoid blocking auth state update
          setTimeout(async () => {
            const roles = await checkUserRoles(session.user.id);
            setState(prev => ({
              ...prev,
              isAdmin: roles.isAdmin,
              isCollaborator: roles.isCollaborator,
              loading: false,
            }));

            // Log successful authentication
            if (event === 'SIGNED_IN') {
              await logSecurityEvent('SIGN_IN', 'AUTH');
            }
          }, 0);
        } else {
          setState(prev => ({
            ...prev,
            isAdmin: false,
            isCollaborator: false,
            loading: false,
          }));
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }));
      
      if (session?.user) {
        checkUserRoles(session.user.id).then(roles => {
          setState(prev => ({
            ...prev,
            isAdmin: roles.isAdmin,
            isCollaborator: roles.isCollaborator,
            loading: false,
          }));
        });
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      if (state.user) {
        await logSecurityEvent('SIGN_OUT', 'AUTH');
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    ...state,
    signOut,
    logSecurityEvent,
  };
};