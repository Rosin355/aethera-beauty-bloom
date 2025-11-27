import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Briefcase } from "lucide-react";

interface UserTypeStepProps {
  userType: string;
  onUserTypeChange: (value: string) => void;
}

const UserTypeStep = ({ userType, onUserTypeChange }: UserTypeStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Chi sei?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Seleziona il tipo di account per personalizzare la tua esperienza
        </p>
      </div>
      
      <RadioGroup 
        value={userType} 
        onValueChange={onUserTypeChange}
        className="grid gap-4"
      >
        <div className="relative">
          <RadioGroupItem 
            value="professional" 
            id="professional" 
            className="peer sr-only" 
          />
          <Label 
            htmlFor="professional" 
            className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-accent peer-checked:bg-accent/5 hover:bg-muted/50"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-fire/10">
              <Briefcase className="h-6 w-6 text-brand-fire" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Professionista del Beauty</p>
              <p className="text-sm text-muted-foreground">
                Estetista, parrucchiere, makeup artist o proprietario di un centro estetico
              </p>
            </div>
          </Label>
        </div>

        <div className="relative">
          <RadioGroupItem 
            value="user" 
            id="user" 
            className="peer sr-only" 
          />
          <Label 
            htmlFor="user" 
            className="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-accent peer-checked:bg-accent/5 hover:bg-muted/50"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-water/10">
              <User className="h-6 w-6 text-brand-water" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Utente</p>
              <p className="text-sm text-muted-foreground">
                Appassionato di beauty interessato a corsi e contenuti formativi
              </p>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default UserTypeStep;
