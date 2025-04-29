
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Training", path: "/training" },
    { name: "Management", path: "/management" },
    { name: "Community", path: "/community" },
    { name: "Support", path: "/support" },
    { name: "Dashboard", path: "/dashboard" }, // Added Dashboard link
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-brand-cream z-50 sticky top-0 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`font-medium text-sm hover:text-brand-fire transition-colors ${
                  isActive(link.path)
                    ? "text-brand-fire"
                    : "text-gray-600"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/login">
              <Button variant="outline" className="border-brand-black hover:bg-brand-black hover:text-white">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-brand-fire hover:bg-brand-fire/90 text-white">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-brand-fire"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-brand-cream border-t">
          <div className="pt-2 pb-4 space-y-1 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block py-2 text-base font-medium hover:text-brand-fire transition-colors ${
                  isActive(link.path)
                    ? "text-brand-fire"
                    : "text-gray-600"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 pb-2 border-t border-gray-200 flex flex-col space-y-2">
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full border-brand-black hover:bg-brand-black hover:text-white">
                  Log In
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-brand-fire hover:bg-brand-fire/90 text-white">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
