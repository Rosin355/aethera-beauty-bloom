
import { Link } from "react-router-dom";

interface LogoProps {
  variant?: "default" | "white";
  showText?: boolean;
}

const Logo = ({ variant = "default", showText = true }: LogoProps) => {
  return (
    <Link to="/" className="flex items-center">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/684f06b1-8076-4f70-a496-af14c8b27fbe.png" 
          alt="Aethera Italia Logo" 
          className="h-10"
        />
        {showText && (
          <h1 className={`ml-2 text-xl font-bold font-playfair ${variant === "white" ? "text-white" : "text-brand-black"}`}>
            Aethera<span className="text-brand-fire">.</span>
          </h1>
        )}
      </div>
    </Link>
  );
};

export default Logo;
