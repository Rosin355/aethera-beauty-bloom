import { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface PersonalInfoProps {
  personalInfo: {
    fullName: string;
    businessName: string;
    city: string;
    phoneNumber: string;
  };
  onInfoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  errors?: {
    fullName?: string;
    businessName?: string;
    city?: string;
    phoneNumber?: string;
  };
  showBusinessName?: boolean;
}

const PersonalInfoStep = ({ 
  personalInfo, 
  onInfoChange, 
  errors,
  showBusinessName = true 
}: PersonalInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-1">
            Nome completo <span className="text-red-300 inline-block">*</span>
            {personalInfo.fullName && !errors?.fullName && (
              <Check className="h-4 w-4 text-success ml-auto" />
            )}
          </Label>
          <Input
            id="fullName"
            name="fullName"
            value={personalInfo.fullName}
            onChange={onInfoChange}
            placeholder="Mario Rossi"
            className={errors?.fullName ? "input-glass h-11 rounded-xl border-destructive" : "input-glass h-11 rounded-xl"}
            required
          />
          {errors?.fullName && (
            <p className="text-sm font-medium text-red-300">{errors.fullName}</p>
          )}
        </div>
        {showBusinessName && (
          <div className="space-y-2">
            <Label htmlFor="businessName" className="flex items-center gap-1">
              Nome attività <span className="text-red-300 inline-block">*</span>
              {personalInfo.businessName && !errors?.businessName && (
                <Check className="h-4 w-4 text-success ml-auto" />
              )}
            </Label>
            <Input
              id="businessName"
              name="businessName"
              value={personalInfo.businessName}
              onChange={onInfoChange}
              placeholder="Beauty Salon Milano"
              className={errors?.businessName ? "input-glass h-11 rounded-xl border-destructive" : "input-glass h-11 rounded-xl"}
              required
            />
            {errors?.businessName && (
              <p className="text-sm font-medium text-red-300">{errors.businessName}</p>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-1">
            Città <span className="text-red-300 inline-block">*</span>
            {personalInfo.city && !errors?.city && (
              <Check className="h-4 w-4 text-success ml-auto" />
            )}
          </Label>
          <Input
            id="city"
            name="city"
            value={personalInfo.city}
            onChange={onInfoChange}
            placeholder="Milano"
            className={errors?.city ? "input-glass h-11 rounded-xl border-destructive" : "input-glass h-11 rounded-xl"}
            required
          />
          {errors?.city && (
            <p className="text-sm font-medium text-red-300">{errors.city}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="flex items-center gap-1">
            Numero di telefono <span className="text-red-300 inline-block">*</span>
            {personalInfo.phoneNumber && !errors?.phoneNumber && (
              <Check className="h-4 w-4 text-success ml-auto" />
            )}
          </Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            value={personalInfo.phoneNumber}
            onChange={onInfoChange}
            placeholder="+39 123 456 7890"
            className={errors?.phoneNumber ? "input-glass h-11 rounded-xl border-destructive" : "input-glass h-11 rounded-xl"}
            required
          />
          {errors?.phoneNumber && (
            <p className="text-sm font-medium text-red-300">{errors.phoneNumber}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
