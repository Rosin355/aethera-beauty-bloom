import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireCollaborator?: boolean;
}

const ONBOARDING_CHECK_TIMEOUT_MS = 4000;
const ONBOARDING_TIMEOUT = Symbol("onboarding-timeout");

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireCollaborator = false 
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isCollaborator } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

  // Check onboarding status
  useEffect(() => {
    let cancelled = false;

    const checkOnboardingStatus = async () => {
      if (!user) {
        if (!cancelled) {
          setOnboardingCompleted(true);
          setOnboardingChecked(true);
        }
        return;
      }
      
      // Skip onboarding check if already on onboarding page
      if (location.pathname === '/onboarding') {
        if (!cancelled) {
          setOnboardingCompleted(true);
          setOnboardingChecked(true);
        }
        return;
      }

      try {
        if (import.meta.env.DEV) {
          console.debug("[ProtectedRoute] onboarding check start", { path: location.pathname, userId: user.id });
        }

        const queryPromise = supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        const timeoutPromise = new Promise<typeof ONBOARDING_TIMEOUT>((resolve) => {
          setTimeout(() => resolve(ONBOARDING_TIMEOUT), ONBOARDING_CHECK_TIMEOUT_MS);
        });

        const result = await Promise.race([queryPromise, timeoutPromise]);

        if (result === ONBOARDING_TIMEOUT) {
          if (import.meta.env.DEV) {
            console.warn("[ProtectedRoute] onboarding check timeout, default allow");
          }
          if (!cancelled) {
            setOnboardingCompleted(true);
          }
          return;
        }

        const { data, error } = result;

        if (error) {
          if (import.meta.env.DEV) {
            console.warn('[ProtectedRoute] onboarding check error, default allow', error);
          }
          if (!cancelled) {
            setOnboardingCompleted(true);
          }
          return;
        }

        if (data && data.onboarding_completed === false) {
          if (!cancelled) {
            setOnboardingCompleted(false);
          }
        } else {
          if (!cancelled) {
            setOnboardingCompleted(true);
          }
          if (import.meta.env.DEV && !data) {
            console.debug("[ProtectedRoute] no profile row for onboarding, default allow");
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[ProtectedRoute] onboarding check exception, default allow', err);
        }
        if (!cancelled) {
          setOnboardingCompleted(true);
        }
      } finally {
        if (!cancelled) {
          setOnboardingChecked(true);
          if (import.meta.env.DEV) {
            console.debug("[ProtectedRoute] onboarding check end");
          }
        }
      }
    };

    if (!loading) {
      setOnboardingChecked(false);
      checkOnboardingStatus();
    }

    return () => {
      cancelled = true;
    };
  }, [user, loading, location.pathname]);

  // Check roles and handle navigation
  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    // Wait for onboarding check to complete
    if (!onboardingChecked) return;

    // Redirect to onboarding if not completed (skip for onboarding page itself)
    if (!onboardingCompleted && location.pathname !== '/onboarding') {
      navigate('/onboarding');
      return;
    }

    if (requireAdmin && !isAdmin) {
      navigate('/dashboard');
    } else if (requireCollaborator && !isCollaborator) {
      navigate('/dashboard');
    }
  }, [
    user,
    loading,
    isAdmin,
    isCollaborator,
    navigate,
    requireAdmin,
    requireCollaborator,
    onboardingChecked,
    onboardingCompleted,
    location.pathname,
  ]);

  if (loading || !onboardingChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accesso Negato</h1>
          <p className="text-muted-foreground">Non hai i permessi per accedere a questa sezione.</p>
        </div>
      </div>
    );
  }

  if (requireCollaborator && !isCollaborator) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accesso Negato</h1>
          <p className="text-muted-foreground">Devi essere un collaboratore per accedere a questa sezione.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
