
import { useState, ChangeEvent } from 'react';

export const useOnboardingForm = () => {
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
    
    if (step === 0) {
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
      
      if (!personalInfo.businessName.trim()) {
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

  return {
    personalInfo,
    professionalInfo,
    businessGoals,
    learningPreferences,
    errors: errors.personalInfo,
    validateStep,
    handlers: {
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
