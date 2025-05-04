
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnboardingFormProps {
  step: number;
}

const OnboardingForm = ({ step }: OnboardingFormProps) => {
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    businessName: "",
    city: "",
    phoneNumber: ""
  });
  
  const [professionalInfo, setProfessionalInfo] = useState({
    experience: "",
    specialties: [],
    teamSize: "",
    servicesOffered: ""
  });
  
  const [businessGoals, setBusinessGoals] = useState({
    primaryGoal: "",
    challenges: [],
    revenueTarget: "",
    growthPlan: ""
  });
  
  const [learningPreferences, setLearningPreferences] = useState({
    preferredFormat: "",
    topicsOfInterest: [],
    timeAvailability: "",
    communicationPreference: ""
  });
  
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  // Render different form based on step
  switch (step) {
    case 0:
      // Personal Information
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                name="fullName"
                value={personalInfo.fullName}
                onChange={handlePersonalInfoChange}
                placeholder="Mario Rossi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Nome attività</Label>
              <Input
                id="businessName"
                name="businessName"
                value={personalInfo.businessName}
                onChange={handlePersonalInfoChange}
                placeholder="Beauty Salon Milano"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Città</Label>
              <Input
                id="city"
                name="city"
                value={personalInfo.city}
                onChange={handlePersonalInfoChange}
                placeholder="Milano"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Numero di telefono</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={personalInfo.phoneNumber}
                onChange={handlePersonalInfoChange}
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>
        </div>
      );
    
    case 1:
      // Professional Experience
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Da quanto tempo sei nel settore beauty?</Label>
            <RadioGroup defaultValue="1-3">
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
            <Select>
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
    
    case 2:
      // Business Goals
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Qual è il tuo obiettivo principale per i prossimi 12 mesi?</Label>
            <RadioGroup defaultValue="clients">
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
              placeholder="Condividi i tuoi piani e le tue aspirazioni per far crescere il tuo business..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      );
    
    case 3:
      // Learning Preferences
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Come preferisci imparare nuove competenze?</Label>
            <RadioGroup defaultValue="video">
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
            <Select>
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
    
    default:
      return null;
  }
};

export default OnboardingForm;
