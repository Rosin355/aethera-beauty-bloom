
import { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalInfoProps {
  personalInfo: {
    fullName: string;
    businessName: string;
    city: string;
    phoneNumber: string;
  };
  onInfoChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const PersonalInfoStep = ({ personalInfo, onInfoChange }: PersonalInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            name="fullName"
            value={personalInfo.fullName}
            onChange={onInfoChange}
            placeholder="Mario Rossi"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName">Nome attività</Label>
          <Input
            id="businessName"
            name="businessName"
            value={personalInfo.businessName}
            onChange={onInfoChange}
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
            onChange={onInfoChange}
            placeholder="Milano"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Numero di telefono</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            value={personalInfo.phoneNumber}
            onChange={onInfoChange}
            placeholder="+39 123 456 7890"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
