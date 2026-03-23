import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  IconLeft?: LucideIcon;
  IconRight?: LucideIcon;
  iconLeftClassName?: string;
  iconRightClassName?: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    children, 
    IconLeft, 
    IconRight, 
    iconLeftClassName, 
    iconRightClassName,
    className,
    variant = "primary",
    fullWidth = false,
    ...props 
  }, ref) => {
    const gradientClass = variant === "primary" 
      ? "bg-gradient-to-r from-[#E46A39] via-[#6AA8B3] to-[#C2977E]"
      : "bg-gradient-to-r from-[#6AA8B3] via-[#CBD8D4] to-[#E46A39]";

    return (
      <div className={cn("relative inline-flex items-center justify-center group", fullWidth && "w-full")}>
        <div
          className={cn(
            "absolute inset-0 duration-1000 opacity-60 transition-all rounded-md blur-lg filter group-hover:opacity-100 group-hover:duration-200",
            gradientClass
          )}
        />
        <button
          ref={ref}
          className={cn(
            "group relative inline-flex items-center justify-center text-base rounded-md bg-gray-900 px-8 py-3 text-lg font-semibold text-white transition-all duration-200 hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-600/30",
            className
          )}
          {...props}
        >
          {IconLeft && (
            <IconLeft 
              className={cn(
                "w-5 h-5 mr-2 transition-transform group-hover:animate-bounce",
                iconLeftClassName
              )} 
            />
          )}
          {children}
          {IconRight && (
            <IconRight 
              className={cn(
                "w-5 h-5 ml-2 transition-transform animate-bounce",
                iconRightClassName
              )} 
            />
          )}
        </button>
      </div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
