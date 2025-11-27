import { useState, ChangeEvent, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOnboardingForm = () => {
  const [userType, setUserType] = useState("professional");

  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    businessName: "",
    city: "",
    phoneNumber: ""
  });
  
  const [professionalInfo, setProfessionalInfo] = useState({
    experience: "1-3",
    specialties: [],
    teamSize: "",
    servicesOffered: ""
  });
  
  const [businessGoals, setBusinessGoals] = useState({
    primaryGoal: "clients",
    challenges: [],
    revenueTarget: "",
    growthPlan: ""
  });
  
  const [learningPreferences, setLearningPreferences] = useState({
    preferredFormat: "video",
    topicsOfInterest: [],
    timeAvailability: "",
    communicationPreference: ""
  });
  
  const [errors, setErrors] = useState({
    personalInfo: {
      fullName: "",
      businessName: "",
      city: "",
      phoneNumber: ""
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleUserTypeChange = (value: string) => {
    setUserType(value);
  };
  
  const handlePersonalInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors.personalInfo[name as keyof typeof errors.personalInfo]) {
      setErrors(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [name]: ""
        }
      }));
    }
  };
  
  const handleExperienceChange = (value: string) => {
    setProfessionalInfo(prev => ({ ...prev, experience: value }));
  };
  
  const handleTeamSizeChange = (value: string) => {
    setProfessionalInfo(prev => ({ ...prev, teamSize: value }));
  };
  
  const handlePrimaryGoalChange = (value: string) => {
    setBusinessGoals(prev => ({ ...prev, primaryGoal: value }));
  };
  
  const handleGrowthPlanChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBusinessGoals(prev => ({ ...prev, growthPlan: e.target.value }));
  };
  
  const handlePreferredFormatChange = (value: string) => {
    setLearningPreferences(prev => ({ ...prev, preferredFormat: value }));
  };
  
  const handleTimeAvailabilityChange = (value: string) => {
    setLearningPreferences(prev => ({ ...prev, timeAvailability: value }));
  };

  const validateStep = (step: number): boolean => {
    let isValid = true;
    
    if (step === 1) {
      // Validate personal info
      const newErrors = {
        fullName: "",
        businessName: "",
        city: "",
        phoneNumber: ""
      };
      
      if (!personalInfo.fullName.trim()) {
        newErrors.fullName = "Il nome completo è obbligatorio";
        isValid = false;
      }
      
      if (userType === "professional" && !personalInfo.businessName.trim()) {
        newErrors.businessName = "Il nome dell'attività è obbligatorio";
        isValid = false;
      }
      
      if (!personalInfo.city.trim()) {
        newErrors.city = "La città è obbligatoria";
        isValid = false;
      }
      
      if (!personalInfo.phoneNumber.trim()) {
        newErrors.phoneNumber = "Il numero di telefono è obbligatorio";
        isValid = false;
      } else {
        // Basic phone validation
        const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
        if (!phoneRegex.test(personalInfo.phoneNumber.replace(/\s/g, ""))) {
          newErrors.phoneNumber = "Inserisci un numero di telefono valido";
          isValid = false;
        }
      }
      
      setErrors(prev => ({
        ...prev,
        personalInfo: newErrors
      }));
    }
    
    return isValid;
  };

  const saveOnboardingData = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Sessione scaduta. Effettua nuovamente l'accesso.");
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: personalInfo.fullName,
          business_name: personalInfo.businessName || null,
          city: personalInfo.city,
          phone_number: personalInfo.phoneNumber,
          user_type: userType,
          experience_level: professionalInfo.experience,
          team_size: professionalInfo.teamSize || null,
          primary_goal: businessGoals.primaryGoal,
          growth_plan: businessGoals.growthPlan || null,
          preferred_learning_format: learningPreferences.preferredFormat,
          time_availability: learningPreferences.timeAvailability || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving onboarding data:', error);
        toast.error("Errore nel salvataggio dei dati. Riprova.");
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in saveOnboardingData:', err);
      toast.error("Si è verificato un errore. Riprova.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [personalInfo, professionalInfo, businessGoals, learningPreferences, userType]);

  return {
    userType,
    personalInfo,
    professionalInfo,
    businessGoals,
    learningPreferences,
    errors: errors.personalInfo,
    isSaving,
    validateStep,
    saveOnboardingData,
    handlers: {
      handleUserTypeChange,
      handlePersonalInfoChange,
      handleExperienceChange,
      handleTeamSizeChange,
      handlePrimaryGoalChange,
      handleGrowthPlanChange,
      handlePreferredFormatChange,
      handleTimeAvailabilityChange
    }
  };
};
