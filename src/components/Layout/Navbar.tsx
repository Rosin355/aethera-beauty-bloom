
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Formazione", path: "/training" },
    { name: "Gestione", path: "/management" },
    { name: "Community", path: "/community" },
    { name: "Supporto", path: "/support" },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Logo variant={scrolled ? "default" : "white"} />
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`font-medium text-sm hover:text-brand-fire transition-colors ${
                  isActive(link.path)
                    ? "text-brand-fire font-semibold"
                    : scrolled ? "text-gray-600" : "text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/login">
              <Button variant={scrolled ? "outline" : "secondary"} className={scrolled ? "border-brand-black hover:bg-brand-black hover:text-white" : ""}>
                Accedi
              </Button>
            </Link>
            <Link to="/signup">
              <Button className={scrolled ? "bg-brand-fire hover:bg-brand-fire/90 text-white" : "bg-white hover:bg-gray-100 text-black"}>
                Registrati
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className={`${scrolled ? "text-gray-600" : "text-white"} hover:text-brand-fire`}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg absolute w-full">
          <div className="pt-2 pb-4 space-y-1 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block py-2 text-base font-medium hover:text-brand-fire transition-colors ${
                  isActive(link.path)
                    ? "text-brand-fire font-semibold"
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
                  Accedi
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-brand-fire hover:bg-brand-fire/90 text-white">
                  Registrati
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
