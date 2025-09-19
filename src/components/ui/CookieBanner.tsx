import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie } from 'lucide-react';

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAcceptedCookies = localStorage.getItem('cookiesAccepted');
    if (!hasAcceptedCookies) {
      // Show banner after a small delay
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
      }, 1000);
    }
  }, []);

  const acceptAllCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const rejectCookies = () => {
    localStorage.setItem('cookiesAccepted', 'false');
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <Card 
        className={`max-w-md w-full bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl pointer-events-auto transform transition-all duration-300 ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Cookie className="w-6 h-6 text-brand-fire shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-brand-black mb-2">
                Utilizziamo i cookie
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Utilizziamo cookie per migliorare la tua esperienza di navigazione e per fornire servizi personalizzati. 
                Continuando a navigare accetti il loro utilizzo.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={acceptAllCookies}
              className="bg-brand-fire hover:bg-brand-fire/90 text-white flex-1"
              size="sm"
            >
              Accetta tutti
            </Button>
            <Button 
              onClick={rejectCookies}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1"
              size="sm"
            >
              Solo necessari
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs">
            <a 
              href="https://www.iubenda.com/privacy-policy/19385152" 
              className="text-brand-fire hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            <span className="text-gray-400">•</span>
            <a 
              href="https://www.iubenda.com/privacy-policy/19385152/cookie-policy" 
              className="text-brand-fire hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieBanner;