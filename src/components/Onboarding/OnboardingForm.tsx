import React, { useEffect } from "react";
import { useOnboardingForm } from "./hooks/useOnboardingForm";
import PersonalInfoStep from "./Steps/PersonalInfoStep";
import ProfessionalExperienceStep from "./Steps/ProfessionalExperienceStep";
import BusinessGoalsStep from "./Steps/BusinessGoalsStep";
import LearningPreferencesStep from "./Steps/LearningPreferencesStep";

interface OnboardingFormProps {
  step: number;
  onValidate?: (isValid: boolean) => void;
  onSaveData?: () => Promise<boolean>;
  setSaveHandler?: (handler: () => Promise<boolean>) => void;
}

const OnboardingForm = ({ step, onValidate, setSaveHandler }: OnboardingFormProps) => {
  const {
    personalInfo,
    professionalInfo,
    businessGoals,
    learningPreferences,
    errors,
    isSaving,
    validateStep,
    saveOnboardingData,
    handlers
  } = useOnboardingForm();
  
  // Expose save handler to parent
  useEffect(() => {
    if (setSaveHandler) {
      setSaveHandler(saveOnboardingData);
    }
  }, [setSaveHandler, saveOnboardingData]);

  // Validate current step when it changes
  useEffect(() => {
    if (onValidate) {
      let isValid = true;
      
      if (step === 0) {
        isValid = !!personalInfo.fullName && 
                 !!personalInfo.businessName && 
                 !!personalInfo.city && 
                 !!personalInfo.phoneNumber;
      }
      
      onValidate(isValid);
    }
  }, [step, onValidate, personalInfo, professionalInfo, businessGoals, learningPreferences]);
  
  // Render different form based on step
  switch (step) {
    case 0:
      return (
        <PersonalInfoStep 
          personalInfo={personalInfo}
          onInfoChange={handlers.handlePersonalInfoChange}
          errors={errors}
        />
      );
    
    case 1:
      return (
        <ProfessionalExperienceStep 
          experience={professionalInfo.experience}
          onExperienceChange={handlers.handleExperienceChange}
          teamSize={professionalInfo.teamSize}
          onTeamSizeChange={handlers.handleTeamSizeChange}
        />
      );
    
    case 2:
      return (
        <BusinessGoalsStep 
          primaryGoal={businessGoals.primaryGoal}
          onPrimaryGoalChange={handlers.handlePrimaryGoalChange}
          growthPlan={businessGoals.growthPlan}
          onGrowthPlanChange={handlers.handleGrowthPlanChange}
        />
      );
    
    case 3:
      return (
        <LearningPreferencesStep 
          preferredFormat={learningPreferences.preferredFormat}
          onPreferredFormatChange={handlers.handlePreferredFormatChange}
          timeAvailability={learningPreferences.timeAvailability}
          onTimeAvailabilityChange={handlers.handleTimeAvailabilityChange}
        />
      );
    
    default:
      return null;
  }
};

export default OnboardingForm;
