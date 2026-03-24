import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCommunityTour() {
  const [showTour, setShowTour] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkTourStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const completed = localStorage.getItem(`community_tour_completed_${user.id}`);
          if (!completed) {
            setShowTour(true);
          }
        }
      } catch (err) {
        console.error("Error checking tour status:", err);
      } finally {
        setIsChecking(false);
      }
    };

    checkTourStatus();
  }, []);

  const completeTour = () => setShowTour(false);
  const skipTour = () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        localStorage.setItem(`community_tour_completed_${user.id}`, "true");
      }
    });
    setShowTour(false);
  };

  return { showTour, isChecking, completeTour, skipTour };
}
