
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfessionalExperienceProps {
  experience: string;
  onExperienceChange?: (value: string) => void;
  teamSize: string;
  onTeamSizeChange?: (value: string) => void;
}

const ProfessionalExperienceStep = ({ 
  experience,
  onExperienceChange,
  teamSize,
  onTeamSizeChange
}: ProfessionalExperienceProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Da quanto tempo sei nel settore beauty?</Label>
        <RadioGroup 
          defaultValue={experience || "1-3"}
          onValueChange={onExperienceChange}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="less-than-1" id="less-than-1" />
            <Label htmlFor="less-than-1">Meno di 1 anno</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="1-3" id="1-3" />
            <Label htmlFor="1-3">1-3 anni</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="3-5" id="3-5" />
            <Label htmlFor="3-5">3-5 anni</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="5-10" id="5-10" />
            <Label htmlFor="5-10">5-10 anni</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="10+" id="10+" />
            <Label htmlFor="10+">Più di 10 anni</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label>Quali sono le tue specialità? (Seleziona tutte quelle applicabili)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="skincare" />
            <label htmlFor="skincare">Skincare</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="makeup" />
            <label htmlFor="makeup">Trucco</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="hair" />
            <label htmlFor="hair">Capelli</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="nails" />
            <label htmlFor="nails">Unghie</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="spa" />
            <label htmlFor="spa">Trattamenti Spa</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="laser" />
            <label htmlFor="laser">Trattamenti Laser</label>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="teamSize">Dimensione del team</Label>
        <Select 
          value={teamSize} 
          onValueChange={onTeamSizeChange}
        >
          <SelectTrigger id="teamSize">
            <SelectValue placeholder="Seleziona dimensione team" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="solo">Solo io</SelectItem>
            <SelectItem value="2-5">2-5 persone</SelectItem>
            <SelectItem value="6-10">6-10 persone</SelectItem>
            <SelectItem value="11+">Più di 10 persone</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProfessionalExperienceStep;
