
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions: HeroAction[];
  image: {
    light: string;
    dark: string;
    alt: string;
  };
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
}: HeroProps) {
  return (
    <section className="relative py-12 sm:py-24 md:py-32 px-4 fade-bottom overflow-hidden pb-0">
      <div className="mx-auto flex max-w-container flex-col gap-12 pt-16 sm:gap-24 relative z-10">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {/* Badge */}
          {badge && (
            <Badge variant="outline" className="animate-appear gap-2 glass border-purple-500/30 text-purple-200">
              <span className="text-purple-300">{badge.text}</span>
              <Link to={badge.action.href} className="flex items-center gap-1 text-purple-200 hover:text-white transition-colors">
                {badge.action.text}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Badge>
          )}

          {/* Title */}
          <h1 className="relative z-10 inline-block animate-appear text-4xl font-semibold leading-tight sm:text-6xl sm:leading-tight md:text-7xl md:leading-tight">
            <span className="gradient-text">{title}</span>
          </h1>

          {/* Description */}
          <p className="text-md relative z-10 max-w-[550px] animate-appear opacity-0 delay-100 font-medium text-gray-300 sm:text-xl">
            {description}
          </p>

          {/* Actions */}
          <div className="relative z-10 flex animate-appear justify-center gap-4 opacity-0 delay-300">
            {actions.map((action, index) => (
              <Button 
                key={index} 
                variant={action.variant || "default"} 
                size="lg" 
                asChild
                className={cn(
                  action.variant === "default" 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 glow-effect" 
                    : "glass border-white/20 text-white hover:bg-white/10"
                )}
              >
                <Link to={action.href} className="flex items-center gap-2">
                  {action.icon}
                  {action.text}
                </Link>
              </Button>
            ))}
          </div>

          {/* Image with Glass Effect */}
          <div className="relative pt-12">
            <MockupFrame
              className="animate-appear opacity-0 delay-700 glass-strong glow-effect"
              size="small"
            >
              <Mockup type="responsive">
                <img
                  src={image.dark}
                  alt={image.alt}
                  width={1248}
                  height={765}
                  className="w-full h-auto rounded-lg"
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="top"
              className="animate-appear-zoom opacity-0 delay-1000"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
