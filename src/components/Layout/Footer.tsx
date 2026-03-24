
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import Logo from "./Logo";
import { Separator } from "@/components/ui/separator";
import {
  getLegalLinks,
  getSiteSection,
  getSiteSettings,
  readSectionExtraArray,
  readSectionExtraObject,
  type LegalLinkRow,
} from "@/lib/api/siteContent";

type FooterLink = {
  label: string;
  path?: string;
  type?: "internal" | "external";
  disabled?: boolean;
  title?: string;
};

type FooterExtra = {
  features_heading?: string;
  company_heading?: string;
  contacts_heading?: string;
  copyright_text?: string;
};

const DEFAULT_BRAND_DESCRIPTION =
  "Potenziamo i professionisti della bellezza con strumenti e risorse per la crescita e il successo professionale.";
const DEFAULT_FEATURE_LINKS: FooterLink[] = [
  { label: "Formazione Online", path: "/dashboard/training", type: "internal" },
  { label: "Strumenti di Gestione", path: "/dashboard/management", type: "internal" },
  { label: "Comunità Professionale", path: "/dashboard/community", type: "internal" },
  { label: "Supporto Personalizzato", path: "mailto:support@4elementitalia.com", type: "external" },
];
const DEFAULT_COMPANY_LINKS: FooterLink[] = [
  { label: "Chi Siamo", disabled: true, title: "Prossimamente disponibile" },
  { label: "Blog", disabled: true, title: "Prossimamente disponibile" },
  { label: "Carriere", disabled: true, title: "Prossimamente disponibile" },
];

const Footer = () => {
  const [brandDescription, setBrandDescription] = useState(DEFAULT_BRAND_DESCRIPTION);
  const [supportEmail, setSupportEmail] = useState("support@4elementitalia.com");
  const [addressLine1, setAddressLine1] = useState("Via Example 123, 00100");
  const [addressLine2, setAddressLine2] = useState("Roma, Italia");
  const [featureLinks, setFeatureLinks] = useState<FooterLink[]>(DEFAULT_FEATURE_LINKS);
  const [companyLinks, setCompanyLinks] = useState<FooterLink[]>(DEFAULT_COMPANY_LINKS);
  const [legalLinks, setLegalLinks] = useState<LegalLinkRow[]>([
    {
      id: "fallback-privacy",
      link_key: "privacy",
      label: "Privacy Policy",
      url: "https://www.iubenda.com/privacy-policy/19385152",
      location: "home_footer",
      is_active: true,
      sort_order: 10,
      created_at: "",
      updated_at: "",
    },
    {
      id: "fallback-terms",
      link_key: "terms",
      label: "Termini",
      url: "https://www.iubenda.com/termini-e-condizioni/19385152",
      location: "home_footer",
      is_active: true,
      sort_order: 20,
      created_at: "",
      updated_at: "",
    },
    {
      id: "fallback-cookie",
      link_key: "cookie",
      label: "Cookie Policy",
      url: "https://www.iubenda.com/privacy-policy/19385152/cookie-policy",
      location: "home_footer",
      is_active: true,
      sort_order: 30,
      created_at: "",
      updated_at: "",
    },
  ]);
  const [headings, setHeadings] = useState({
    features: "Funzionalità",
    company: "Azienda",
    contacts: "Contatti",
    copyright: "© {year} 4 elementi Italia. Tutti i diritti riservati.",
  });

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      const [footerSection, settings, links] = await Promise.all([
        getSiteSection("home_footer"),
        getSiteSettings(),
        getLegalLinks("home_footer"),
      ]);

      if (!mounted) return;

      if (footerSection) {
        setBrandDescription(footerSection.body ?? DEFAULT_BRAND_DESCRIPTION);
        const extraObject = readSectionExtraObject<FooterExtra>(footerSection, {});
        const extraFeatureLinks = readSectionExtraArray<FooterLink>(footerSection, "feature_links", DEFAULT_FEATURE_LINKS);
        const extraCompanyLinks = readSectionExtraArray<FooterLink>(footerSection, "company_links", DEFAULT_COMPANY_LINKS);

        setHeadings((prev) => ({
          features: extraObject.features_heading ?? prev.features,
          company: extraObject.company_heading ?? prev.company,
          contacts: extraObject.contacts_heading ?? prev.contacts,
          copyright: extraObject.copyright_text ?? prev.copyright,
        }));

        if (extraFeatureLinks.length > 0) {
          setFeatureLinks(extraFeatureLinks);
        }
        if (extraCompanyLinks.length > 0) {
          setCompanyLinks(extraCompanyLinks);
        }
      }

      if (settings.support_email?.value_text) {
        setSupportEmail(settings.support_email.value_text);
      }
      if (settings.company_address_line_1?.value_text) {
        setAddressLine1(settings.company_address_line_1.value_text);
      }
      if (settings.company_address_line_2?.value_text) {
        setAddressLine2(settings.company_address_line_2.value_text);
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

  return (
    <footer className="bg-white text-brand-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <Logo />
            <p className="text-gray-600">
              {brandDescription}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">{headings.features}</h3>
            <ul className="space-y-4">
              {featureLinks.map((link) => (
                <li key={link.label}>
                  {link.type === "internal" && link.path ? (
                    <Link to={link.path} className="text-gray-600 hover:text-brand-fire transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.path} className="text-gray-600 hover:text-brand-fire transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">{headings.company}</h3>
            <ul className="space-y-4">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  {link.disabled ? (
                    <span className="text-gray-400 cursor-not-allowed" title={link.title ?? "Prossimamente disponibile"}>
                      {link.label}
                    </span>
                  ) : link.type === "internal" && link.path ? (
                    <Link to={link.path} className="text-gray-600 hover:text-brand-fire transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.path} className="text-gray-600 hover:text-brand-fire transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">{headings.contacts}</h3>
            <div className="flex items-start mb-4">
              <Mail size={20} className="text-brand-fire mr-3 mt-1" />
              <a href={`mailto:${supportEmail}`} className="text-gray-600 hover:text-brand-fire transition-colors">
                {supportEmail}
              </a>
            </div>
            <p className="text-gray-600 mb-6">
              {addressLine1}<br />
              {addressLine2}
            </p>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-center md:text-left">
            {headings.copyright.replace("{year}", new Date().getFullYear().toString())}
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <a
                key={`${link.location}-${link.link_key}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-brand-fire text-sm font-medium iubenda-white iubenda-noiframe iubenda-embed"
                title={link.label}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
