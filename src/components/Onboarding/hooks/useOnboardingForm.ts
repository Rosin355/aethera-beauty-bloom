
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
  
  const handlePersonalInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
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

  return {
    personalInfo,
    professionalInfo,
    businessGoals,
    learningPreferences,
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
