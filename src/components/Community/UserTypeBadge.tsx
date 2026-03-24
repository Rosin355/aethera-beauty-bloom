import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Briefcase, GraduationCap, User } from "lucide-react";

interface UserTypeBadgeProps {
  userType?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const userTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  professional: {
    label: "Titolare",
    icon: Building2,
    color: "bg-fire/20 text-fire border-fire/30",
    description: "Titolare di centro estetico o spa"
  },
  employee: {
    label: "Dipendente",
    icon: Briefcase,
    color: "bg-water/20 text-water border-water/30",
    description: "Dipendente o collaboratore"
  },
  student: {
    label: "Studente",
    icon: GraduationCap,
    color: "bg-earth/20 text-earth border-earth/30",
    description: "Studente o neolaureato"
  },
  freelance: {
    label: "Freelance",
    icon: User,
    color: "bg-air/20 text-air border-air/30",
    description: "Professionista freelance"
  },
  user: {
    label: "Utente",
    icon: User,
    color: "bg-muted text-muted-foreground border-border",
    description: "Utente della piattaforma"
  }
};

export function UserTypeBadge({ userType, showLabel = true, size = "sm" }: UserTypeBadgeProps) {
  const config = userTypeConfig[userType || "user"] || userTypeConfig.user;
  const Icon = config.icon;
  
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const badgeSize = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${config.color} ${badgeSize} font-medium cursor-help`}
          >
            <Icon className={`${iconSize} ${showLabel ? "mr-1" : ""}`} />
            {showLabel && config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
