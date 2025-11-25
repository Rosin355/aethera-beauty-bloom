
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Logo from "./Logo";

import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isLandingPage = location.pathname === '/' || location.pathname === '/landing';
  const isHomePage = location.pathname === '/home';

  const navLinks = useMemo(() => {
    // Minimal menu for landing page
    if (isLandingPage) {
      return [];
    }

    // Dashboard links for authenticated users
    if (user) {
      return [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Formazione", path: "/dashboard/training" },
        { name: "Gestione", path: "/dashboard/management" },
        { name: "Community", path: "/dashboard/community" },
        ...(isAdmin ? [{ name: "Admin", path: "/admin/dashboard" }] : []),
      ];
    }

    // Institutional links for home page (non-authenticated)
    if (isHomePage) {
      return [
        { name: "Home", path: "/home" },
        { name: "Chi Siamo", path: "/home#chi-siamo" },
        { name: "Servizi", path: "/home#servizi" },
        { name: "Contatti", path: "/home#contatti" },
      ];
    }

    // Default links
    return [
      { name: "Home", path: "/home" },
      { name: "Caratteristiche", path: "#features" },
      { name: "Contatti", path: "#contact" },
    ];
  }, [user, isAdmin, isLandingPage, isHomePage]);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/home');
  };
  
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
    <nav className={cn(
      "fixed w-full z-50 transition-all duration-300", 
      scrolled 
        ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm" 
        : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Logo variant={scrolled || isMenuOpen ? "default" : "white"} />
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "font-medium text-sm transition-colors",
                  isActive(link.path)
                    ? "text-accent font-semibold"
                    : scrolled 
                      ? "text-muted-foreground hover:text-accent" 
                      : "text-white hover:text-accent"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User size={16} />
                  <span>Ciao, {user.email}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Esci
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant={scrolled ? "outline" : "secondary"}>
                    Accedi
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-white hover:bg-gray-200 text-black">
                    Registrati
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className={cn(
                "hover:text-accent",
                scrolled ? "text-muted-foreground" : "text-white"
              )}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border shadow-lg absolute w-full">
          <div className="pt-2 pb-4 space-y-1 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "block py-2 text-base font-medium hover:text-accent transition-colors",
                  isActive(link.path)
                    ? "text-accent font-semibold"
                    : "text-muted-foreground"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 pb-2 border-t border-border flex flex-col space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                    <User size={16} />
                    <span>Ciao, {user.email}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Esci
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Accedi
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-white hover:bg-gray-200 text-black">
                      Registrati
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
