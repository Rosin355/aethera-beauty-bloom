import { useState, useCallback } from "react";
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
import CompletionDialog from "@/components/Onboarding/CompletionDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isStepValid, setIsStepValid] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [saveHandler, setSaveHandler] = useState<(() => Promise<boolean>) | null>(null);
  
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
  
  const handleNext = async () => {
    if (currentStep === 0 && !isStepValid) {
      toast({
        title: "Compila tutti i campi",
        description: "Per favore compila tutti i campi obbligatori per continuare.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding - save data first
      setIsCompleting(true);
      
      if (saveHandler) {
        const success = await saveHandler();
        if (success) {
          setShowCompletionDialog(true);
        }
      } else {
        sonnerToast.error("Errore nel salvataggio. Riprova.");
      }
      
      setIsCompleting(false);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = async () => {
    // Mark onboarding as completed even when skipped
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error marking onboarding as skipped:', err);
    }
    
    toast({
      title: "Onboarding saltato",
      description: "Puoi completare il processo di onboarding più tardi nelle impostazioni del profilo."
    });
    navigate("/dashboard");
  };
  
  const handleValidationChange = (isValid: boolean) => {
    setIsStepValid(isValid);
  };

  const handleSetSaveHandler = useCallback((handler: () => Promise<boolean>) => {
    setSaveHandler(() => handler);
  }, []);
  
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
              <span className="text-sm text-muted-foreground">
                Passaggio {currentStep + 1} di {steps.length}
              </span>
            </div>
            <CardDescription>
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>
          
          {/* Progress bar */}
          <div className="w-full bg-muted h-1">
            <div 
              className="bg-accent h-1 transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <CardContent className="pt-6">
            <OnboardingForm 
              step={currentStep}
              onValidate={handleValidationChange}
              setSaveHandler={handleSetSaveHandler}
            />
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <div>
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isCompleting}
                >
                  Indietro
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isCompleting}
                >
                  Salta
                </Button>
              )}
            </div>
            <Button 
              onClick={handleNext}
              className={`bg-accent hover:bg-accent/90 ${currentStep === 0 && !isStepValid ? 'opacity-70' : ''}`}
              disabled={(currentStep === 0 && !isStepValid) || isCompleting}
            >
              {isCompleting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Salvataggio...
                </>
              ) : currentStep === steps.length - 1 ? (
                "Completa"
              ) : (
                "Continua"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Completion Dialog with Confetti */}
      <CompletionDialog 
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
      />
    </div>
  );
};

export default Onboarding;
