
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import Logo from "./Logo";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  return (
    <footer className="bg-white text-brand-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <Logo />
            <p className="text-gray-600">
              Potenziamo i professionisti della bellezza con strumenti e risorse per la crescita e il successo professionale.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">Funzionalità</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/training" className="text-gray-600 hover:text-brand-fire transition-colors">
                  Formazione Online
                </Link>
              </li>
              <li>
                <Link to="/management" className="text-gray-600 hover:text-brand-fire transition-colors">
                  Strumenti di Gestione
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-gray-600 hover:text-brand-fire transition-colors">
                  Comunità Professionale
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-600 hover:text-brand-fire transition-colors">
                  Supporto Personalizzato
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">Azienda</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-brand-fire transition-colors">
                  Chi Siamo
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-brand-fire transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-600 hover:text-brand-fire transition-colors">
                  Carriere
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-brand-fire transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">Contatti</h3>
            <div className="flex items-start mb-4">
              <Mail size={20} className="text-brand-fire mr-3 mt-1" />
              <a href="mailto:support@4elementitalia.com" className="text-gray-600 hover:text-brand-fire transition-colors">
                support@4elementitalia.com
              </a>
            </div>
            <p className="text-gray-600 mb-6">
              Via Example 123, 00100<br />
              Roma, Italia
            </p>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500">© {new Date().getFullYear()} 4 elementi Italia. Tutti i diritti riservati.</p>
            <div className="mt-4 md:mt-0 flex space-x-4">
            <a 
              href="https://www.iubenda.com/privacy-policy/19385152" 
              className="text-gray-500 hover:text-brand-fire text-sm iubenda-white iubenda-noiframe iubenda-embed" 
              title="Privacy Policy"
            >
              Privacy
            </a>
            <Link to="/terms" className="text-gray-500 hover:text-brand-fire text-sm">Termini</Link>
            <a 
              href="https://www.iubenda.com/privacy-policy/19385152/cookie-policy" 
              className="text-gray-500 hover:text-brand-fire text-sm iubenda-white iubenda-noiframe iubenda-embed" 
              title="Cookie Policy"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
