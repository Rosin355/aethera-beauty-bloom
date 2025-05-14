
import { Link } from "react-router-dom";
import { 
  FacebookIcon, 
  InstagramIcon, 
  TwitterIcon, 
  LinkedinIcon, 
  Mail, 
  MessageCircle, 
  PhoneCall 
} from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-t from-brand-black to-gray-900 text-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <Logo variant="white" />
            <p className="text-gray-300 mt-4">
              Potenziamo i professionisti della bellezza con strumenti e risorse per la crescita e il successo professionale.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="bg-white/10 hover:bg-brand-fire rounded-full p-2.5 text-white hover:text-white transition-colors">
                <FacebookIcon size={18} />
              </a>
              <a href="#" className="bg-white/10 hover:bg-brand-fire rounded-full p-2.5 text-white hover:text-white transition-colors">
                <InstagramIcon size={18} />
              </a>
              <a href="#" className="bg-white/10 hover:bg-brand-fire rounded-full p-2.5 text-white hover:text-white transition-colors">
                <TwitterIcon size={18} />
              </a>
              <a href="#" className="bg-white/10 hover:bg-brand-fire rounded-full p-2.5 text-white hover:text-white transition-colors">
                <LinkedinIcon size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Funzionalità</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/training" className="text-gray-300 hover:text-brand-fire transition-colors flex items-center">
                  <span className="bg-brand-fire/10 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Formazione Online
                </Link>
              </li>
              <li>
                <Link to="/management" className="text-gray-300 hover:text-brand-fire transition-colors flex items-center">
                  <span className="bg-brand-fire/10 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Strumenti di Gestione
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-gray-300 hover:text-brand-fire transition-colors flex items-center">
                  <span className="bg-brand-fire/10 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Comunità Professionale
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-300 hover:text-brand-fire transition-colors flex items-center">
                  <span className="bg-brand-fire/10 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Supporto Personalizzato
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Azienda</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-brand-fire transition-colors flex items-center">
                  <span className="bg-brand-fire/10 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Chi Siamo
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-brand-fire transition-colors flex items-center">
                  <span className="bg-brand-fire/10 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-300 hover:text-brand-fire transition-colors flex items-center">
                  <span className="bg-brand-fire/10 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Carriere
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-brand-fire transition-colors flex items-center">
                  <span className="bg-brand-fire/10 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-brand-fire transition-colors flex items-center">
                  <span className="bg-brand-fire/10 rounded-full w-1.5 h-1.5 mr-2"></span>
                  Termini di Servizio
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-6">Contatti</h3>
            <ul className="space-y-6">
              <li className="flex items-start">
                <Mail size={20} className="text-brand-fire mr-3 mt-1" />
                <a href="mailto:support@4elementitalia.com" className="text-gray-300 hover:text-brand-fire transition-colors">
                  support@4elementitalia.com
                </a>
              </li>
              <li className="flex items-start">
                <PhoneCall size={20} className="text-brand-fire mr-3 mt-1" />
                <a href="tel:+123456789" className="text-gray-300 hover:text-brand-fire transition-colors">
                  +39 123 456 789
                </a>
              </li>
              <li className="flex items-start">
                <MessageCircle size={20} className="text-brand-fire mr-3 mt-1" />
                <span className="text-gray-300">
                  Live chat disponibile<br />
                  Lun-Ven: 9:00-18:00
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">© {new Date().getFullYear()} 4 elementi Italia. Tutti i diritti riservati.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link to="/privacy" className="text-gray-400 hover:text-brand-fire text-sm">Privacy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-brand-fire text-sm">Termini</Link>
            <Link to="/cookies" className="text-gray-400 hover:text-brand-fire text-sm">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
