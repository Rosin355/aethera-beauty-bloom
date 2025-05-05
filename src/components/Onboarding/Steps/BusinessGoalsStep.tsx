
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface BusinessGoalsProps {
  primaryGoal: string;
  onPrimaryGoalChange?: (value: string) => void;
  growthPlan: string;
  onGrowthPlanChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const BusinessGoalsStep = ({
  primaryGoal,
  onPrimaryGoalChange,
  growthPlan,
  onGrowthPlanChange
}: BusinessGoalsProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Qual è il tuo obiettivo principale per i prossimi 12 mesi?</Label>
        <RadioGroup 
          defaultValue={primaryGoal || "clients"}
          onValueChange={onPrimaryGoalChange}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="clients" id="clients" />
            <Label htmlFor="clients">Aumentare il numero di clienti</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="revenue" id="revenue" />
            <Label htmlFor="revenue">Aumentare il fatturato</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="skills" id="skills" />
            <Label htmlFor="skills">Migliorare le competenze tecniche</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="expand" id="expand" />
            <Label htmlFor="expand">Espandere il business</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="efficiency" id="efficiency" />
            <Label htmlFor="efficiency">Migliorare l'efficienza operativa</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label>Quali sono le tue sfide principali? (Seleziona tutte quelle applicabili)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="marketing" />
            <label htmlFor="marketing">Marketing e acquisizione clienti</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="finance" />
            <label htmlFor="finance">Gestione finanziaria</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="time" />
            <label htmlFor="time">Gestione del tempo</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="staff" />
            <label htmlFor="staff">Gestione del personale</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="technical" />
            <label htmlFor="technical">Competenze tecniche</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="competition" />
            <label htmlFor="competition">Competizione</label>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="growthPlan">Descrivi brevemente il tuo piano di crescita</Label>
        <Textarea
          id="growthPlan"
          value={growthPlan}
          onChange={onGrowthPlanChange}
          placeholder="Condividi i tuoi piani e le tue aspirazioni per far crescere il tuo business..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
};

export default BusinessGoalsStep;
