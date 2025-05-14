
import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "default" | "white";
  showText?: boolean;
}

const Logo = ({
  variant = "default",
  showText = true
}: LogoProps) => {
  return (
    <Link to="/" className="flex items-center">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/684f06b1-8076-4f70-a496-af14c8b27fbe.png" 
          alt="4 elementi Italia Logo" 
          className="h-10" 
        />
        {showText && (
          <span className={`ml-2 font-bold text-xl font-playfair ${variant === "white" ? "text-white" : "text-brand-black"}`}>
            4elementi
          </span>
        )}
      </div>
    </Link>
  );
};

export default Logo;
