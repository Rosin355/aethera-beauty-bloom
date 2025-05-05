
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LearningPreferencesProps {
  preferredFormat: string;
  onPreferredFormatChange?: (value: string) => void;
  timeAvailability: string;
  onTimeAvailabilityChange?: (value: string) => void;
}

const LearningPreferencesStep = ({
  preferredFormat,
  onPreferredFormatChange,
  timeAvailability,
  onTimeAvailabilityChange
}: LearningPreferencesProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Come preferisci imparare nuove competenze?</Label>
        <RadioGroup 
          defaultValue={preferredFormat || "video"}
          onValueChange={onPreferredFormatChange}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="video" id="video" />
            <Label htmlFor="video">Video corsi</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="webinar" id="webinar" />
            <Label htmlFor="webinar">Webinar dal vivo</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="reading" id="reading" />
            <Label htmlFor="reading">Guide e materiali di lettura</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="inperson" id="inperson" />
            <Label htmlFor="inperson">Workshop in presenza</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="coaching" id="coaching" />
            <Label htmlFor="coaching">Coaching one-to-one</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label>Quali argomenti ti interessano di più? (Seleziona tutti quelli applicabili)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="techniques" />
            <label htmlFor="techniques">Tecniche di trattamento avanzate</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="business" />
            <label htmlFor="business">Gestione aziendale</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="marketing-topic" />
            <label htmlFor="marketing-topic">Marketing digitale</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="customer" />
            <label htmlFor="customer">Gestione clienti</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="trends" />
            <label htmlFor="trends">Tendenze del settore</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="products" />
            <label htmlFor="products">Conoscenza dei prodotti</label>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="timeAvailability">Quanto tempo puoi dedicare alla formazione ogni settimana?</Label>
        <Select 
          value={timeAvailability}
          onValueChange={onTimeAvailabilityChange}
        >
          <SelectTrigger id="timeAvailability">
            <SelectValue placeholder="Seleziona disponibilità" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="1-2">1-2 ore</SelectItem>
            <SelectItem value="3-5">3-5 ore</SelectItem>
            <SelectItem value="5-10">5-10 ore</SelectItem>
            <SelectItem value="10+">Più di 10 ore</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LearningPreferencesStep;
