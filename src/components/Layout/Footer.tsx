
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

const Footer = () => {
  return (
    <footer className="bg-brand-black text-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold font-playfair">
              Aethera<span className="text-brand-fire">.</span>
            </h2>
            <p className="text-sm text-gray-300 mt-4">
              Empowering beauticians with professional tools and resources for growth and success.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-300 hover:text-brand-fire transition-colors">
                <FacebookIcon size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-brand-fire transition-colors">
                <InstagramIcon size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-brand-fire transition-colors">
                <TwitterIcon size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-brand-fire transition-colors">
                <LinkedinIcon size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/training" className="text-gray-300 hover:text-brand-fire transition-colors">
                  Online Training
                </Link>
              </li>
              <li>
                <Link to="/management" className="text-gray-300 hover:text-brand-fire transition-colors">
                  Management Tools
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-gray-300 hover:text-brand-fire transition-colors">
                  Professional Community
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-300 hover:text-brand-fire transition-colors">
                  Personalized Support
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-brand-fire transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-brand-fire transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-300 hover:text-brand-fire transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-brand-fire transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-brand-fire transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-2">
                <Mail size={18} className="text-brand-fire" />
                <a href="mailto:support@aethera.com" className="text-gray-300 hover:text-brand-fire transition-colors">
                  support@aethera.com
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <PhoneCall size={18} className="text-brand-fire" />
                <a href="tel:+123456789" className="text-gray-300 hover:text-brand-fire transition-colors">
                  +1 (234) 567-89
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <MessageCircle size={18} className="text-brand-fire" />
                <span className="text-gray-300">
                  Live chat available
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Aethera. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
