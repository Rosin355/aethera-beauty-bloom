import { Card, CardContent } from "@/components/ui/card";
import { Info, HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
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
    <Card className="bg-primary/5 border-primary/20 mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full p-0 h-auto hover:bg-transparent flex items-start justify-between text-left"
            >
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground">{title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
              </div>
              <HelpCircle className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          {tips && tips.length > 0 && (
            <CollapsibleContent>
              <div className="mt-4 pt-4 border-t border-primary/10">
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  Suggerimenti
                </p>
                <ul className="space-y-2">
                  {tips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {tip}
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
