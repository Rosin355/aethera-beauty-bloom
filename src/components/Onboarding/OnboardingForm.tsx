import React, { useEffect } from "react";
import { useOnboardingForm } from "./hooks/useOnboardingForm";
import UserTypeStep from "./Steps/UserTypeStep";
import PersonalInfoStep from "./Steps/PersonalInfoStep";
import ProfessionalExperienceStep from "./Steps/ProfessionalExperienceStep";
import BusinessGoalsStep from "./Steps/BusinessGoalsStep";
import LearningPreferencesStep from "./Steps/LearningPreferencesStep";

interface OnboardingFormProps {
  step: number;
  onValidate?: (isValid: boolean) => void;
  setSaveHandler?: (handler: () => Promise<boolean>) => void;
}

const OnboardingForm = ({ step, onValidate, setSaveHandler }: OnboardingFormProps) => {
  const {
    userType,
    personalInfo,
    professionalInfo,
    businessGoals,
    learningPreferences,
    errors,
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
        // User type step is always valid (has default value)
        isValid = true;
      } else if (step === 1) {
        // Personal info step
        isValid = !!personalInfo.fullName && 
                 !!personalInfo.city && 
                 !!personalInfo.phoneNumber;
        // Business name required only for professionals
        if (userType === "professional") {
          isValid = isValid && !!personalInfo.businessName;
        }
      }
      
      onValidate(isValid);
    }
  }, [step, onValidate, personalInfo, userType]);
  
  // Render different form based on step
  switch (step) {
    case 0:
      // User Type Selection
      return (
        <UserTypeStep 
          userType={userType}
          onUserTypeChange={handlers.handleUserTypeChange}
        />
      );

    case 1:
      // Personal Information
      return (
        <PersonalInfoStep 
          personalInfo={personalInfo}
          onInfoChange={handlers.handlePersonalInfoChange}
          errors={errors}
          showBusinessName={userType === "professional"}
        />
      );
    
    case 2:
      // Professional Experience (only for professionals)
      return (
        <ProfessionalExperienceStep 
          experience={professionalInfo.experience}
          onExperienceChange={handlers.handleExperienceChange}
          teamSize={professionalInfo.teamSize}
          onTeamSizeChange={handlers.handleTeamSizeChange}
        />
      );
    
    case 3:
      // Business Goals
      return (
        <BusinessGoalsStep 
          primaryGoal={businessGoals.primaryGoal}
          onPrimaryGoalChange={handlers.handlePrimaryGoalChange}
          growthPlan={businessGoals.growthPlan}
          onGrowthPlanChange={handlers.handleGrowthPlanChange}
        />
      );
    
    case 4:
      // Learning Preferences
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
