
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Layout/Logo";
import OnboardingForm from "@/components/Onboarding/OnboardingForm";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: "Dati personali",
      description: "Parliamo di te e della tua attività"
    },
    {
      title: "Esperienza professionale",
      description: "Condividi con noi la tua esperienza nel settore beauty"
    },
    {
      title: "Obiettivi di business",
      description: "Quali sono i tuoi obiettivi principali?"
    },
    {
      title: "Preferenze di apprendimento",
      description: "Come preferisci migliorare le tue competenze?"
    }
  ];
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      toast({
        title: "Onboarding completato!",
        description: "La tua dashboard personalizzata è pronta."
      });
      navigate("/dashboard/personalized");
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    toast({
      title: "Onboarding saltato",
      description: "Puoi completare il processo di onboarding più tardi nelle impostazioni del profilo."
    });
    navigate("/dashboard");
  };
  
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-cream to-white flex flex-col">
      <div className="p-4">
        <Logo />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <CardTitle className="text-2xl font-playfair">
                {steps[currentStep].title}
              </CardTitle>
              <span className="text-sm text-gray-500">
                Passaggio {currentStep + 1} di {steps.length}
              </span>
            </div>
            <CardDescription>
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 h-1">
            <div 
              className="bg-brand-fire h-1 transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <CardContent className="pt-6">
            <OnboardingForm step={currentStep} />
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <div>
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  Indietro
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                >
                  Salta
                </Button>
              )}
            </div>
            <Button 
              onClick={handleNext}
              className="bg-brand-fire hover:bg-brand-fire/90"
            >
              {currentStep === steps.length - 1 ? "Completa" : "Continua"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
