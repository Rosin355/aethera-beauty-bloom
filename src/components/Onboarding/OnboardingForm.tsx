
import { useOnboardingForm } from "./hooks/useOnboardingForm";
import PersonalInfoStep from "./Steps/PersonalInfoStep";
import ProfessionalExperienceStep from "./Steps/ProfessionalExperienceStep";
import BusinessGoalsStep from "./Steps/BusinessGoalsStep";
import LearningPreferencesStep from "./Steps/LearningPreferencesStep";

interface OnboardingFormProps {
  step: number;
  onValidate?: (isValid: boolean) => void;
}

const OnboardingForm = ({ step, onValidate }: OnboardingFormProps) => {
  const {
    personalInfo,
    professionalInfo,
    businessGoals,
    learningPreferences,
    errors,
    validateStep,
    handlers
  } = useOnboardingForm();
  
  // Validate current step when it changes
  React.useEffect(() => {
    if (onValidate) {
      const isValid = validateStep(step);
      onValidate(isValid);
    }
  }, [step, onValidate, validateStep, personalInfo, professionalInfo, businessGoals, learningPreferences]);
  
  // Render different form based on step
  switch (step) {
    case 0:
      // Personal Information
      return (
        <PersonalInfoStep 
          personalInfo={personalInfo}
          onInfoChange={handlers.handlePersonalInfoChange}
          errors={errors}
        />
      );
    
    case 1:
      // Professional Experience
      return (
        <ProfessionalExperienceStep 
          experience={professionalInfo.experience}
          onExperienceChange={handlers.handleExperienceChange}
          teamSize={professionalInfo.teamSize}
          onTeamSizeChange={handlers.handleTeamSizeChange}
        />
      );
    
    case 2:
      // Business Goals
      return (
        <BusinessGoalsStep 
          primaryGoal={businessGoals.primaryGoal}
          onPrimaryGoalChange={handlers.handlePrimaryGoalChange}
          growthPlan={businessGoals.growthPlan}
          onGrowthPlanChange={handlers.handleGrowthPlanChange}
        />
      );
    
    case 3:
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
