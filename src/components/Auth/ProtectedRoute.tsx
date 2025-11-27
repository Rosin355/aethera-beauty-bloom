import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireCollaborator?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireCollaborator = false 
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isCollaborator, checkUserRoles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rolesChecked, setRolesChecked] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);

  // Check onboarding status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;
      
      // Skip onboarding check if already on onboarding page
      if (location.pathname === '/onboarding') {
        setOnboardingChecked(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding status:', error);
          setOnboardingChecked(true);
          return;
        }

        if (data && data.onboarding_completed === false) {
          setOnboardingCompleted(false);
        } else {
          setOnboardingCompleted(true);
        }
      } catch (err) {
        console.error('Error in onboarding check:', err);
      }
      
      setOnboardingChecked(true);
    };

    if (user && !loading) {
      checkOnboardingStatus();
    }
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

    // For admin/collaborator routes, ensure roles are checked
    if (!rolesChecked && (requireAdmin || requireCollaborator)) {
      checkUserRoles(user.id).finally(() => setRolesChecked(true));
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
    rolesChecked,
    checkUserRoles,
    onboardingChecked,
    onboardingCompleted,
    location.pathname,
  ]);

  if (loading || !onboardingChecked || ((requireAdmin || requireCollaborator) && !rolesChecked)) {
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
