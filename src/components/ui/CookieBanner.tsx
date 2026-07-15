import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie } from 'lucide-react';
import {
  getLegalLinks,
  getSiteSection,
  readSectionExtraObject,
  type LegalLinkRow,
} from "@/lib/api/siteContent";

type CookieBannerExtra = {
  reject_label?: string;
};

const DEFAULT_COOKIE_TITLE = "Utilizziamo i cookie";
const DEFAULT_COOKIE_DESCRIPTION =
  "Utilizziamo cookie per migliorare la tua esperienza di navigazione e per fornire servizi personalizzati. Continuando a navigare accetti il loro utilizzo.";
const DEFAULT_ACCEPT_LABEL = "Accetta tutti";
const DEFAULT_REJECT_LABEL = "Solo necessari";

export const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [title, setTitle] = useState(DEFAULT_COOKIE_TITLE);
  const [description, setDescription] = useState(DEFAULT_COOKIE_DESCRIPTION);
  const [acceptLabel, setAcceptLabel] = useState(DEFAULT_ACCEPT_LABEL);
  const [rejectLabel, setRejectLabel] = useState(DEFAULT_REJECT_LABEL);
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
        setTitle(section.title ?? DEFAULT_COOKIE_TITLE);
        setDescription(section.body ?? DEFAULT_COOKIE_DESCRIPTION);
        setAcceptLabel(section.cta_label ?? DEFAULT_ACCEPT_LABEL);
        setRejectLabel(extra.reject_label ?? DEFAULT_REJECT_LABEL);
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
        className={`pointer-events-auto w-full max-w-full transform border-white/15 bg-[#070707]/95 text-white shadow-[0_30px_90px_rgba(0,0,0,.58)] backdrop-blur-xl transition-all duration-300 sm:max-w-md ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 h-6 w-6 shrink-0 text-[#bfeeff]" />
            <div className="flex-1">
              <h3 className="mb-2 font-semibold text-white">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-white/65">
                {description}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={acceptAllCookies}
              className="flex-1 rounded-full bg-white text-[#050505] hover:bg-[#effbff]"
              size="sm"
            >
              {acceptLabel}
            </Button>
            <Button 
              onClick={rejectCookies}
              variant="outline"
              className="flex-1 rounded-full border-white/25 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
              size="sm"
            >
              {rejectLabel}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs">
            {legalLinks.map((link, index) => (
              <div key={`${link.link_key}-${link.location}`} className="flex items-center gap-2">
                {index > 0 && <span className="text-white/35">•</span>}
                <a 
                  href={link.url}
                  className="text-[#bfeeff] hover:underline"
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
