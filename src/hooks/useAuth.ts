import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check user roles
          setTimeout(async () => {
            await checkUserRoles(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsCollaborator(false);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRoles(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRoles = async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (roles) {
        const userRoles = roles.map(r => r.role);
        setIsAdmin(userRoles.includes('admin'));
        setIsCollaborator(userRoles.includes('collaborator') || userRoles.includes('admin'));
      }
    } catch (error) {
      console.error('Error checking user roles:', error);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    
    // Use the correct sandbox URL instead of localhost
    const redirectUrl = "https://3c37cda4-be73-48a8-a792-03ed1a7f45e8.sandbox.lovable.dev/dashboard";
    
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
      setIsAdmin(false);
      setIsCollaborator(false);
      toast.success('Disconnesso con successo');
    }
    
    setLoading(false);
    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = "https://3c37cda4-be73-48a8-a792-03ed1a7f45e8.sandbox.lovable.dev/reset-password";
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    return { error };
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    isCollaborator,
    signUp,
    signIn,
    signOut,
    resetPassword,
    checkUserRoles
  };
};