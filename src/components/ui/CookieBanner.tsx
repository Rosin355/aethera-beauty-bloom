import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Cookie } from 'lucide-react';
import {
  getLegalLinks,
  getSiteSection,
  readSectionExtraObject,
  type LegalLinkRow,
} from "@/lib/api/siteContent";

type CookieBannerExtra = {
  reject_label?: string;
};

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [title, setTitle] = useState("Utilizziamo i cookie");
  const [description, setDescription] = useState(
    "Utilizziamo cookie per migliorare la tua esperienza di navigazione e per fornire servizi personalizzati. Continuando a navigare accetti il loro utilizzo.",
  );
  const [acceptLabel, setAcceptLabel] = useState("Accetta tutti");
  const [rejectLabel, setRejectLabel] = useState("Solo necessari");
  const [legalLinks, setLegalLinks] = useState<LegalLinkRow[]>([
    {
      id: "cookie-fallback-privacy",
      link_key: "privacy",
      label: "Privacy Policy",
      url: "https://www.iubenda.com/privacy-policy/19385152",
      location: "cookie_banner",
      is_active: true,
      sort_order: 10,
      created_at: "",
      updated_at: "",
    },
    {
      id: "cookie-fallback-policy",
      link_key: "cookie",
      label: "Cookie Policy",
      url: "https://www.iubenda.com/privacy-policy/19385152/cookie-policy",
      location: "cookie_banner",
      is_active: true,
      sort_order: 20,
      created_at: "",
      updated_at: "",
    },
  ]);

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

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      const [section, links] = await Promise.all([
        getSiteSection("cookie_banner"),
        getLegalLinks("cookie_banner"),
      ]);

      if (!mounted) return;

      if (section) {
        const extra = readSectionExtraObject<CookieBannerExtra>(section, {});
        setTitle(section.title ?? title);
        setDescription(section.body ?? description);
        setAcceptLabel(section.cta_label ?? acceptLabel);
        setRejectLabel(extra.reject_label ?? rejectLabel);
      }

      if (links.length > 0) {
        setLegalLinks(links);
      }
    };

    loadContent();
    return () => {
      mounted = false;
    };
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
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-3 sm:p-4 pointer-events-none">
      <Card 
        className={`max-w-full sm:max-w-md w-full bg-white/98 backdrop-blur-sm border-gray-200 shadow-2xl pointer-events-auto transform transition-all duration-300 ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Cookie className="w-6 h-6 text-brand-fire shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-brand-black mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={acceptAllCookies}
              className="bg-brand-fire hover:bg-brand-fire/90 text-white flex-1"
              size="sm"
            >
              {acceptLabel}
            </Button>
            <Button 
              onClick={rejectCookies}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1"
              size="sm"
            >
              {rejectLabel}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs">
            {legalLinks.map((link, index) => (
              <div key={`${link.link_key}-${link.location}`} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">•</span>}
                <a 
                  href={link.url}
                  className="text-brand-fire hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieBanner;
