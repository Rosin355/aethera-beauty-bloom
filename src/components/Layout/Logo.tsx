
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
        <img src="/4-elementi-logo.png" alt="4 elementi Italia Logo" className="h-12 w-auto" />
        {showText && (
          <span className={`ml-2 font-playfair font-bold text-xl ${variant === "white" ? "text-white" : "text-brand-black"}`}>
            4 elementi
          </span>
        )}
      </div>
    </Link>
  );
};

export default Logo;
