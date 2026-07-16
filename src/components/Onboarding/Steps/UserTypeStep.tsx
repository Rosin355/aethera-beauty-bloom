import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, Building2, Briefcase, GraduationCap, Sparkles, Crown, Scissors, Check } from "lucide-react";

interface UserTypeStepProps {
  userType: string;
  onUserTypeChange: (value: string) => void;
}

const userTypeOptions = [
  {
    value: "owner",
    id: "owner",
    icon: Building2,
    title: "Titolare / Spa Manager",
    description: "Proprietario o gestore di centro estetico, spa o salone"
  },
  {
    value: "senior_esthetician",
    id: "senior_esthetician",
    icon: Crown,
    title: "Estetista Senior",
    description: "Professionista con oltre 5 anni di esperienza nel settore"
  },
  {
    value: "esthetician",
    id: "esthetician",
    icon: Sparkles,
    title: "Estetista",
    description: "Professionista dell'estetica con esperienza"
  },
  {
    value: "hairdresser",
    id: "hairdresser",
    icon: Scissors,
    title: "Parrucchiere / Hair Stylist",
    description: "Professionista del settore capelli e acconciature"
  },
  {
    value: "employee",
    id: "employee",
    icon: Briefcase,
    title: "Dipendente / Collaboratore",
    description: "Lavori presso un centro estetico o salone"
  },
  {
    value: "freelance",
    id: "freelance",
    icon: User,
    title: "Freelance",
    description: "Professionista autonomo che lavora in proprio"
  },
  {
    value: "student",
    id: "student",
    icon: GraduationCap,
    title: "Studente / Neolaureato",
    description: "Stai studiando o hai appena completato la formazione"
  },
  {
    value: "user",
    id: "user",
    icon: User,
    title: "Appassionato Beauty",
    description: "Interessato a corsi e contenuti formativi del settore"
  }
];

/** Values a user can actually select — used by the parent to enable "Continua". */
export const USER_TYPE_VALUES = userTypeOptions.map((option) => option.value);

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
          // Radix radio items expose data-state, not :checked — compute the
          // selected state from the controlled value so it is ALWAYS visible.
          const isSelected = userType === option.value;
          return (
            <div key={option.value} className="relative">
              <RadioGroupItem
                value={option.value}
                id={option.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={option.id}
                className={`relative flex items-center gap-3 p-3 pr-10 border-2 rounded-2xl cursor-pointer transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background ${
                  isSelected
                    ? "border-ice/70 bg-ice/[.06] shadow-[0_0_34px_rgba(191,238,255,0.14)]"
                    : "border-white/10 bg-white/[.02] hover:border-white/25 hover:bg-white/[.05]"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                    isSelected ? "bg-ice/15 text-ice" : "bg-white/5 text-white/60"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{option.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {option.description}
                  </p>
                </div>
                {isSelected && (
                  <span
                    className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-ice text-[#050505]"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default UserTypeStep;
