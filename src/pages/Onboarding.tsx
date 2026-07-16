import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
import { ensureCenterForUser } from "@/lib/api/centers";
import { toast as sonnerToast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isStepValid, setIsStepValid] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [saveHandler, setSaveHandler] = useState<(() => Promise<boolean>) | null>(null);
  
  const steps = [
    {
      title: "Tipo di account",
      description: "Dicci chi sei per personalizzare la tua esperienza"
    },
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
    if ((currentStep === 0 || currentStep === 1) && !isStepValid) {
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
          // Every owner gets a center (idempotent: reuses an existing membership).
          try {
            await ensureCenterForUser();
          } catch (centerError) {
            console.error("Errore nella creazione del centro:", centerError);
          }
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
    setIsSkipping(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error marking onboarding as skipped:', error);
        }

        try {
          await ensureCenterForUser();
        } catch (centerError) {
          console.error("Errore nella creazione del centro:", centerError);
        }
      }

      toast({
        title: "Onboarding saltato",
        description: "Puoi completare il processo di onboarding più tardi nelle impostazioni del profilo."
      });
      
      navigate("/dashboard");
    } catch (err) {
      console.error('Error in handleSkip:', err);
      sonnerToast.error("Errore durante il salto dell'onboarding");
    } finally {
      setIsSkipping(false);
    }
  };
  
  const handleValidationChange = (isValid: boolean) => {
    setIsStepValid(isValid);
  };

  const handleSetSaveHandler = useCallback((handler: () => Promise<boolean>) => {
    setSaveHandler(() => handler);
  }, []);
  
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <div className="page-glow" aria-hidden="true" />
      <div className="p-4 relative z-[1]">
        <Logo />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 relative z-[1]">
        <Card className="w-full max-w-3xl glass-card rounded-[28px] border-white/10 bg-transparent">
          <CardHeader>
            <div className="flex justify-between items-center mb-3">
              <span className="inline-flex items-center gap-3">
                <span className="eyebrow-line" aria-hidden="true" />
                <span className="eyebrow">
                  Passaggio {currentStep + 1} di {steps.length}
                </span>
              </span>
            </div>
            <CardTitle className="font-playfair text-3xl">
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription className="pt-1">
              {steps[currentStep].description}
            </CardDescription>
          </CardHeader>

          {/* Progress line */}
          <div className="w-full bg-white/10 h-px" role="presentation">
            <div
              className="bg-ice h-px shadow-[0_0_12px_rgba(191,238,255,0.65)] transition-all duration-300 ease-in-out"
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
          
          <CardFooter className="flex justify-between border-t border-white/10 pt-6">
            <div>
              {currentStep > 0 ? (
                <Button
                  variant="secondary"
                  size="pill"
                  onClick={handlePrevious}
                  disabled={isCompleting || isSkipping}
                >
                  Indietro
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="pill"
                  onClick={handleSkip}
                  disabled={isCompleting || isSkipping}
                >
                  {isSkipping ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      Salto...
                    </>
                  ) : (
                    'Salta'
                  )}
                </Button>
              )}
            </div>
            <Button
              size="pill"
              onClick={handleNext}
              disabled={((currentStep === 0 || currentStep === 1) && !isStepValid) || isCompleting || isSkipping}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
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
