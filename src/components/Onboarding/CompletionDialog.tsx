
import { useEffect, useRef } from "react";
import ConfettiGenerator from "confetti-js";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CompletionDialog = ({ open, onOpenChange }: CompletionDialogProps) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (open && canvasRef.current) {
      const confettiSettings = {
        target: canvasRef.current,
        max: 200,
        size: 1.5,
        animate: true,
        props: ['circle', 'square', 'triangle', 'line'],
        colors: [
          [235, 106, 57],   // brand-fire
          [106, 168, 179],  // brand-water
          [203, 216, 212],  // brand-air
          [194, 151, 126],  // brand-earth
          [246, 244, 237],  // brand-cream
        ],
        clock: 25,
        rotate: true,
        start_from_edge: true,
        respawn: false
      };
      
      const confetti = new ConfettiGenerator(confettiSettings);
      confetti.render();
      
      return () => confetti.clear();
    }
  }, [open]);
  
  const handleGoToDashboard = () => {
    navigate("/dashboard/personalized");
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <canvas 
          ref={canvasRef} 
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
        ></canvas>
        
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-playfair flex justify-center gap-2 items-center">
            <PartyPopper className="h-6 w-6 text-brand-fire" />
            Profilo Completato!
          </DialogTitle>
          <DialogDescription className="pt-4 text-base">
            Grazie per aver completato il tuo profilo! Le informazioni che hai condiviso
            saranno utilizzate dal nostro sistema di intelligenza artificiale per
            personalizzare la tua esperienza e offrirti consigli e suggerimenti più
            pertinenti alle tue esigenze.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 my-2 bg-brand-cream/30 rounded-md border border-brand-cream">
          <p className="text-sm">
            La nostra AI utilizzerà questi dati per:
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
            <li>Personalizzare la tua dashboard con contenuti rilevanti</li>
            <li>Suggerire corsi di formazione in linea con i tuoi obiettivi</li>
            <li>Offrire consigli pratici per migliorare il tuo business</li>
            <li>Adattare gli strumenti di gestione alle tue necessità specifiche</li>
          </ul>
        </div>
        
        <DialogFooter className="sm:justify-center mt-4">
          <Button 
            onClick={handleGoToDashboard}
            className="bg-brand-fire hover:bg-brand-fire/90 px-8"
          >
            Vai alla tua Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionDialog;
