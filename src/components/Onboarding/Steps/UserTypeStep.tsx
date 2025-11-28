import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Building2, Briefcase, GraduationCap, Sparkles, Crown, Scissors } from "lucide-react";

interface UserTypeStepProps {
  userType: string;
  onUserTypeChange: (value: string) => void;
}

const userTypeOptions = [
  {
    value: "owner",
    id: "owner",
    icon: Building2,
    iconColor: "text-fire",
    bgColor: "bg-fire/10",
    title: "Titolare / Spa Manager",
    description: "Proprietario o gestore di centro estetico, spa o salone"
  },
  {
    value: "senior_esthetician",
    id: "senior_esthetician",
    icon: Crown,
    iconColor: "text-earth",
    bgColor: "bg-earth/10",
    title: "Estetista Senior",
    description: "Professionista con oltre 5 anni di esperienza nel settore"
  },
  {
    value: "esthetician",
    id: "esthetician",
    icon: Sparkles,
    iconColor: "text-water",
    bgColor: "bg-water/10",
    title: "Estetista",
    description: "Professionista dell'estetica con esperienza"
  },
  {
    value: "hairdresser",
    id: "hairdresser",
    icon: Scissors,
    iconColor: "text-air",
    bgColor: "bg-air/10",
    title: "Parrucchiere / Hair Stylist",
    description: "Professionista del settore capelli e acconciature"
  },
  {
    value: "employee",
    id: "employee",
    icon: Briefcase,
    iconColor: "text-water",
    bgColor: "bg-water/10",
    title: "Dipendente / Collaboratore",
    description: "Lavori presso un centro estetico o salone"
  },
  {
    value: "freelance",
    id: "freelance",
    icon: User,
    iconColor: "text-air",
    bgColor: "bg-air/10",
    title: "Freelance",
    description: "Professionista autonomo che lavora in proprio"
  },
  {
    value: "student",
    id: "student",
    icon: GraduationCap,
    iconColor: "text-earth",
    bgColor: "bg-earth/10",
    title: "Studente / Neolaureato",
    description: "Stai studiando o hai appena completato la formazione"
  },
  {
    value: "user",
    id: "user",
    icon: User,
    iconColor: "text-muted-foreground",
    bgColor: "bg-muted",
    title: "Appassionato Beauty",
    description: "Interessato a corsi e contenuti formativi del settore"
  }
];

const UserTypeStep = ({ userType, onUserTypeChange }: UserTypeStepProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Chi sei?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Seleziona il ruolo che meglio ti descrive per personalizzare la tua esperienza
        </p>
      </div>
      
      <RadioGroup 
        value={userType} 
        onValueChange={onUserTypeChange}
        className="grid gap-3 md:grid-cols-2"
      >
        {userTypeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div key={option.value} className="relative">
              <RadioGroupItem 
                value={option.value} 
                id={option.id} 
                className="peer sr-only" 
              />
              <Label 
                htmlFor={option.id} 
                className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-muted/50"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${option.bgColor}`}>
                  <Icon className={`h-5 w-5 ${option.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{option.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {option.description}
                  </p>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default UserTypeStep;
