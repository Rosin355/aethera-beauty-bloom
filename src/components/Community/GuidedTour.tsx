import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, MessageSquare, Users, Briefcase, User, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface GuidedTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps = [
  {
    id: "welcome",
    title: "Benvenuto nella Community!",
    description: "Ti guideremo attraverso le principali funzionalità della community. Scopri come connetterti con altri professionisti del beauty.",
    icon: CheckCircle,
    color: "text-primary",
    tips: [
      "La community è il tuo spazio per crescere professionalmente",
      "Condividi esperienze e impara dagli altri",
      "Costruisci la tua rete di contatti nel settore"
    ]
  },
  {
    id: "forum",
    title: "Forum",
    description: "Il cuore della community! Qui puoi creare discussioni, condividere consigli e chiedere aiuto su temi specifici.",
    icon: MessageSquare,
    color: "text-fire",
    tips: [
      "Scegli la categoria giusta: Business, Tecnico, Eventi, Networking",
      "Usa titoli chiari per attirare risposte utili",
      "Interagisci con i post degli altri: like e commenti sono benvenuti!"
    ]
  },
  {
    id: "network",
    title: "Network Professionale",
    description: "Scopri e connettiti con altri professionisti. Filtra per ruolo (Titolare, Dipendente, Studente) o località.",
    icon: Users,
    color: "text-water",
    tips: [
      "Usa i filtri per trovare colleghi nella tua zona",
      "I badge colorati indicano il ruolo professionale",
      "Visita i profili per vedere competenze e contatti"
    ]
  },
  {
    id: "jobs",
    title: "Bacheca Lavoro",
    description: "Trova opportunità di lavoro o pubblica annunci per cercare collaboratori per il tuo centro.",
    icon: Briefcase,
    color: "text-earth",
    tips: [
      "Titolari: pubblica offerte per trovare talenti",
      "In cerca di lavoro: consulta gli annunci e candidati",
      "Filtra per tipo di contratto e località"
    ]
  },
  {
    id: "profile",
    title: "Il tuo Profilo",
    description: "Completa il tuo profilo per farti trovare! Aggiungi competenze, esperienza e contatti social.",
    icon: User,
    color: "text-air",
    tips: [
      "Un profilo completo aumenta la tua visibilità",
      "Aggiungi il CV se cerchi opportunità lavorative",
      "Collega LinkedIn e Instagram per facilitare i contatti"
    ]
  }
];

export function GuidedTour({ onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === tourSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsVisible(false);
    // Save that user completed the tour
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // We could store this in a user_preferences table in the future
        localStorage.setItem(`community_tour_completed_${user.id}`, 'true');
      }
    } catch (err) {
      console.error('Error saving tour completion:', err);
    }
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg"
        >
          <Card className="border-2 shadow-2xl">
            <CardHeader className="relative pb-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-14 h-14 rounded-full bg-primary/10`}>
                  <Icon className={`h-7 w-7 ${step.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Passo {currentStep + 1} di {tourSteps.length}
                  </p>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{step.description}</p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Suggerimenti
                </p>
                <ul className="space-y-2">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Progress dots */}
              <div className="flex justify-center gap-2 pt-2">
                {tourSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep 
                        ? "bg-primary w-6" 
                        : index < currentStep 
                          ? "bg-primary/50" 
                          : "bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className={isFirstStep ? "invisible" : ""}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkip}>
                  Salta tour
                </Button>
                <Button onClick={handleNext}>
                  {isLastStep ? (
                    <>
                      Inizia!
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Avanti
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
