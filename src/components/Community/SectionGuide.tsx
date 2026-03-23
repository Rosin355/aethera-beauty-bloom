import { Card, CardContent } from "@/components/ui/card";
import { Info, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

interface SectionGuideProps {
  title: string;
  description: string;
  tips?: string[];
  defaultOpen?: boolean;
}

export function SectionGuide({ title, description, tips, defaultOpen = false }: SectionGuideProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="bg-primary/5 border-primary/20 mb-4 sm:mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-3 sm:p-4">
          <CollapsibleTrigger asChild>
            <button 
              type="button"
              className="w-full text-left flex items-start gap-2 sm:gap-3"
            >
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">{title}</h4>
                  <HelpCircle className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{description}</p>
              </div>
            </button>
          </CollapsibleTrigger>
          
          {tips && tips.length > 0 && (
            <CollapsibleContent>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-primary/10 ml-6 sm:ml-8">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Suggerimenti
                </p>
                <ul className="space-y-2">
                  {tips.map((tip, index) => (
                    <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span className="break-words">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleContent>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  );
}
