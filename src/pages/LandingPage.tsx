import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Play,
  ChevronDown,
  ArrowRight,
  Star,
  Sparkles,
  Download,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSiteVideo, SiteVideo } from "@/lib/siteVideos";
import VideoPlayer from "@/components/ui/VideoPlayer";
import {
  getLegalLinks,
  getSiteSections,
  getTestimonials,
  readSectionExtraArray,
  readSectionExtraObject,
  type LegalLinkRow,
  type SiteSectionRow,
  type TestimonialRow,
} from "@/lib/api/siteContent";

type LandingNavLink = {
  label: string;
  href: string;
};

type LandingHeroExtra = {
  paragraphs?: string[];
  cta_note?: string;
  form_title?: string;
  form_subtitle?: string;
  submit_loading_label?: string;
  submit_label?: string;
  success_note?: string;
  form_disclaimer?: string;
};

type LandingFinalCtaExtra = {
  closing_title?: string;
  closing_subtitle?: string;
  cta_note?: string;
};

type LandingNewsletterExtra = {
  benefits?: string[];
  form_title?: string;
  name_label?: string;
  name_placeholder?: string;
  email_label?: string;
  email_placeholder?: string;
  loading_label?: string;
  privacy_note?: string;
};

type LandingFooterExtra = {
  recovery_text?: string;
  recovery_cta?: string;
};

const getSectionByKey = (
  sections: Record<string, SiteSectionRow>,
  key: string,
): SiteSectionRow | null => sections[key] ?? null;

// Warm, luminous beauty/wellness photography (full color — the UI stays monochrome)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?auto=format&fit=crop&w=2000&q=80";

const MOSAIC_IMAGES = [
  "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
];

const STEP_IMAGES: Array<[string, string]> = [
  [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
  ],
  [
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
  ],
  [
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=600&q=80",
  ],
];

const HERO_STATS: Array<[string, string]> = [
  ["10+", "Anni di esperienza"],
  ["4", "Elementi del metodo"],
  ["+40%", "Crescita media clientela"],
];

const SERVICES = [
  {
    name: "Fuoco",
    tag: "Consulenza",
    description: "Piattaforma 4 Elementi Italia e consulenza strategica personalizzata.",
  },
  {
    name: "Terra",
    tag: "Restyling",
    description:
      "Riqualificazione del centro estetico, restyling dell'arredamento e sistema operativo.",
  },
  {
    name: "Aria",
    tag: "Marketing",
    description: "Marketing specifico per il settore beauty.",
  },
  {
    name: "Acqua",
    tag: "Partnership",
    description: "Partnership con Tokio, Nee Make Up Milano ed Everlinespa.",
  },
];

const METHOD_STEPS = [
  {
    index: "01",
    title: "Calcolo del costo orario",
    subtitle:
      "Organizza il tuo listino in modo strategico, anche se non sei brava con i numeri o il marketing.",
    checks: [
      "Analisi dei costi fissi e variabili del centro",
      "Definizione del costo orario reale della cabina",
      "Una base solida su cui costruire ogni prezzo",
    ],
  },
  {
    index: "02",
    title: "Calcolo del prodotto",
    subtitle: "Trasmetti professionalità e fatti scegliere dai tuoi clienti.",
    checks: [
      "Incidenza del prodotto per ogni trattamento",
      "Un listino chiaro che comunica il tuo valore",
      "Prezzi che non devi più giustificare",
    ],
  },
  {
    index: "03",
    title: "Calcolo del margine operativo",
    subtitle: "La formula per valutare il prezzo giusto.",
    checks: [
      "Margine corretto su ogni servizio",
      "Vendere meglio, senza svenderti",
      "Crescita sostenibile del tuo centro",
    ],
  },
];

const fallbackTestimonials: Array<{
  quote: string;
  name: string;
  title: string;
  image: string;
}> = [
  {
    quote:
      "4 elementi Italia ha completamente trasformato il modo in cui gestisco il mio centro estetico. Gli strumenti di gestione mi fanno risparmiare ore ogni settimana.",
    name: "Sofia Loren",
    title: "Titolare di Centro Estetico",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
  },
  {
    quote:
      "L'assistente AI offre consigli personalizzati che mi hanno aiutato a ottimizzare le operazioni del mio business. Le risorse di formazione sono di prima qualità.",
    name: "Marco Rossi",
    title: "Specialista Skincare",
    image:
      "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
  },
  {
    quote:
      "Ho aumentato la mia clientela del 40% da quando uso gli strumenti analitici di 4 elementi Italia. Le intuizioni mi hanno aiutato a personalizzare i miei servizi.",
    name: "Elena Chen",
    title: "Estetista Freelance",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
  },
];

const LandingPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletterData, setNewsletterData] = useState({
    name: "",
    email: ""
  });
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [previewVideo, setPreviewVideo] = useState<SiteVideo | null>(null);
  const [landingSections, setLandingSections] = useState<Record<string, SiteSectionRow>>({});
  const [testimonialRows, setTestimonialRows] = useState<TestimonialRow[]>([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [landingLegalLinks, setLandingLegalLinks] = useState<LegalLinkRow[]>([
    {
      id: "landing-privacy-fallback",
      link_key: "privacy",
      label: "Privacy Policy",
      url: "https://www.iubenda.com/privacy-policy/19385152",
      location: "landing_footer",
      is_active: true,
      sort_order: 10,
      created_at: "",
      updated_at: "",
    },
    {
      id: "landing-cookie-fallback",
      link_key: "cookie",
      label: "Cookie Policy",
      url: "https://www.iubenda.com/privacy-policy/19385152/cookie-policy",
      location: "landing_footer",
      is_active: true,
      sort_order: 20,
      created_at: "",
      updated_at: "",
    },
  ]);

  useEffect(() => {
    const loadVideo = async () => {
      const video = await getSiteVideo('preview'); // Usando 'preview' per il modal
      if (video) {
        setPreviewVideo(video);
      }
    };

    loadVideo();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadCmsContent = async () => {
      const [sections, legalLinks, testimonials] = await Promise.all([
        getSiteSections([
          "landing_header",
          "landing_hero",
          "landing_final_cta",
          "landing_newsletter",
          "landing_footer",
        ]),
        getLegalLinks("landing_footer"),
        getTestimonials(),
      ]);

      if (!mounted) return;

      setLandingSections(sections);
      if (legalLinks.length > 0) {
        setLandingLegalLinks(legalLinks);
      }
      setTestimonialRows(testimonials);
    };

    loadCmsContent();
    return () => {
      mounted = false;
    };
  }, []);

  const landingHeader = getSectionByKey(landingSections, "landing_header");
  const landingHero = getSectionByKey(landingSections, "landing_hero");
  const landingFinalCta = getSectionByKey(landingSections, "landing_final_cta");
  const landingNewsletter = getSectionByKey(landingSections, "landing_newsletter");
  const landingFooter = getSectionByKey(landingSections, "landing_footer");

  const navLinks = readSectionExtraArray<LandingNavLink>(landingHeader, "nav_links", [
    { label: "VIDEO GRATUITO", href: "#video" },
    { label: "CHI SIAMO", href: "#about" },
    { label: "SERVIZI", href: "#services" },
    { label: "CONTATTI", href: "#contact" },
  ]);

  const heroExtra = readSectionExtraObject<LandingHeroExtra>(landingHero, {});
  const heroParagraphs = heroExtra.paragraphs ?? [
    "Ciao! Se sei un'estetista professionista e ti stai chiedendo come strutturare un listino prezzi che sia chiaro, professionale e che valorizzi davvero i tuoi servizi... sei nel posto giusto.",
    "Mi chiamo Davide e con 4 Elementi Italia aiutiamo estetiste e professionisti del benessere a diventare imprenditori consapevoli, strategici e autonomi – senza stress, senza perdere tempo in corsi complicati o contenuti poco chiari.",
  ];
  const finalCtaExtra = readSectionExtraObject<LandingFinalCtaExtra>(landingFinalCta, {});
  const newsletterExtra = readSectionExtraObject<LandingNewsletterExtra>(landingNewsletter, {});
  const newsletterBenefits = newsletterExtra.benefits ?? [
    "Tips settimanali esclusivi per far crescere il tuo business",
    "Strategie pratiche e strumenti pronti all'uso",
    "Accesso anticipato a corsi, risorse e novità",
  ];
  const landingFooterExtra = readSectionExtraObject<LandingFooterExtra>(landingFooter, {});

  const testimonialItems =
    testimonialRows.length > 0
      ? testimonialRows.map((item) => ({
          quote: item.quote,
          name: item.name,
          title: item.role,
          image: item.image_url ?? fallbackTestimonials[0].image,
        }))
      : fallbackTestimonials;

  const heroTestimonial = testimonialItems[activeTestimonial % testimonialItems.length];

  const scrollToId = (id: string, block: ScrollLogicalPosition = "start") => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci nome e email per continuare",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    console.log('🔍 Inizio registrazione per:', formData.email);
    try {
      const response = await supabase.functions.invoke('mailing-list-signup', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          source: 'hero_section'
        }
      });

      console.log('📧 Risposta edge function:', response);

      if (response.error) {
        if (response.error.message?.includes('già registrata')) {
          // Email già registrata, recupero l'access token
          const { data: existingData } = await supabase
            .from('mailing_list')
            .select('access_token')
            .eq('email', formData.email.trim())
            .single();

          if (existingData?.access_token) {
            toast({
              title: "Accesso trovato!",
              description: "Ti stiamo reindirizzando alla tua area riservata. Email di promemoria inviata!",
            });

            setTimeout(() => {
              window.location.href = `/welcome?token=${existingData.access_token}`;
            }, 1000);
            return;
          }
        }
        throw new Error(response.error.message || 'Errore durante la registrazione');
      }

      // Redirect to welcome page with token
      const data = response.data;
      if (data?.access_token) {
        // Mostra feedback basato sullo stato dell'email
        const emailStatus = data.email_sent ? "Email di benvenuto inviata!" : "Registrazione completata (email in sospeso)";

        toast({
          title: "Perfetto! 🎉",
          description: emailStatus + " Ti stiamo reindirizzando...",
        });

        setTimeout(() => {
          window.location.href = `/welcome?token=${data.access_token}`;
        }, 1500);
      }

    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova tra qualche minuto.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterData.name.trim() || !newsletterData.email.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci nome e email per iscriverti alla newsletter",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingNewsletter(true);
    try {
      const response = await supabase.functions.invoke('newsletter-subscribe', {
        body: {
          email: newsletterData.email.trim(),
          name: newsletterData.name.trim(),
          source: 'newsletter_section'
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Iscrizione completata!",
        description: "Ti sei iscritto con successo alla nostra newsletter. Riceverai presto contenuti esclusivi!",
      });

      setNewsletterData({ name: "", email: "" });

    } catch (error) {
      console.error('Errore durante l\'iscrizione alla newsletter:', error);

      const errorMessage = error instanceof Error && error.message?.includes('Email già iscritta')
        ? "Questa email è già iscritta alla newsletter"
        : "Si è verificato un errore. Riprova tra qualche minuto.";

      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar — sticky, translucent over the hero */}
      <header className="sticky top-0 z-40 h-16 border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto flex h-full items-center justify-between px-6">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/4-elementi-logo.png"
              alt="4 Elementi Italia Logo"
              className="h-9 w-auto"
            />
            <span className="hidden font-display text-lg font-semibold tracking-tight sm:block">
              4 Elementi Italia
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((navLink) => (
              <a
                key={navLink.href}
                href={navLink.href}
                className="text-sm text-foreground/80 transition-colors hover:text-foreground"
              >
                {navLink.label}
              </a>
            ))}
          </nav>

          <Button size="pill" className="h-9 px-5" onClick={() => navigate('/login')}>
            Area riservata
          </Button>
        </div>
      </header>

      {/* Hero — full-bleed warm photo, text left, photo breathing on the right */}
      <section className="relative -mt-16 flex min-h-screen flex-col justify-center overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Horizontal legibility gradient: dark behind the text, transparent over the photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/15" />
        {/* Soft bottom fade for the floating cards and section transition */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
        {/* Stronger veil on small screens where text sits over the photo */}
        <div className="absolute inset-0 bg-background/40 lg:hidden" />

        <div className="container relative z-10 mx-auto px-6 pb-36 pt-36 lg:pb-44">
          <div className="max-w-2xl lg:max-w-[55%]">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Il metodo 4 Elementi
            </p>

            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tightest text-foreground sm:text-6xl lg:text-7xl">
              {landingHero?.title ?? "SEI UN'ESTETISTA"}
              <span className="block">{landingHero?.subtitle ?? "PROFESSIONISTA?"}</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              {landingHero?.body ??
                "Ecco come strutturare il tuo listino in modo strategico (senza stress)"}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="pill"
                onClick={() => scrollToId('video-form', 'center')}
              >
                <Download />
                {landingHero?.cta_label ?? "SCARICA IL MINI CORSO GRATUITO"}
              </Button>
              <Button
                size="pill"
                variant="secondary"
                onClick={() => scrollToId('video')}
              >
                <Play />
                Guarda il video
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              {heroExtra.cta_note ??
                "✓ Nessun pagamento richiesto • Download immediato • Guarda quando vuoi"}
            </p>

            <p className="mt-10 text-xs uppercase tracking-widest text-muted-foreground">
              Formazione — Community — Strumenti gestionali
            </p>

            {/* Stats row */}
            <div className="mt-6 flex flex-wrap items-center divide-x divide-border">
              {HERO_STATS.map(([value, label], statIndex) => (
                <div
                  key={label}
                  className={statIndex === 0 ? "pr-6 sm:pr-10" : "px-6 sm:px-10"}
                >
                  <p className="font-display text-3xl font-semibold sm:text-4xl">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating testimonial card — bottom left */}
        <div className="absolute bottom-10 left-8 z-10 hidden w-80 lg:block">
          <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-lg shadow-black/20 backdrop-blur-md">
            <p className="text-sm leading-relaxed text-foreground/90">
              “{heroTestimonial.quote.length > 140
                ? `${heroTestimonial.quote.slice(0, 140)}…`
                : heroTestimonial.quote}”
            </p>
            <div className="mt-4 flex items-center gap-3">
              <img
                src={heroTestimonial.image}
                alt={heroTestimonial.name}
                className="h-9 w-9 rounded-full border border-border object-cover"
              />
              <div>
                <p className="text-sm font-medium">{heroTestimonial.name}</p>
                <p className="text-xs text-muted-foreground">{heroTestimonial.title}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-1.5">
              {testimonialItems.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  aria-label={`Testimonianza ${index + 1}`}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    index === activeTestimonial % testimonialItems.length
                      ? 'bg-foreground'
                      : 'bg-foreground/25'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Floating highlight card — right */}
        <div className="absolute right-8 top-1/2 z-10 hidden w-64 -translate-y-1/2 xl:block">
          <div className="rounded-2xl border border-border bg-card/80 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
            <Badge>
              <Sparkles className="h-3 w-3" />
              PIÙ RICHIESTO
            </Badge>
            <img
              src={MOSAIC_IMAGES[0]}
              alt="Mini corso Il Listino Perfetto"
              className="mt-3 h-28 w-full rounded-xl object-cover"
            />
            <p className="mt-3 font-display text-base font-semibold">Il Listino Perfetto</p>
            <p className="text-xs text-muted-foreground">Mini corso gratuito in video</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex -space-x-2">
                {fallbackTestimonials.map((item) => (
                  <img
                    key={item.name}
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    className="h-6 w-6 rounded-full border border-border object-cover"
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Vai al mini corso"
                onClick={() => scrollToId('video-form', 'center')}
              >
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll hint */}
      <div className="flex flex-col items-center gap-2 py-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Scorri per esplorare
        </p>
        <ChevronDown className="h-4 w-4 animate-bounce text-muted-foreground" />
      </div>

      {/* Feature split — services list + browser mockup with the free video */}
      <section id="video" className="border-t border-border py-24">
        <div className="container mx-auto grid items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <Badge id="services">
              <Sparkles className="h-3 w-3" />
              I SERVIZI
            </Badge>
            <h2 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Tutto ciò che ti serve per crescere
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Formazione, strategia e strumenti digitali per trasformare il tuo centro
              estetico in una vera impresa.
            </p>

            <div className="mt-8 divide-y divide-border border-y border-border">
              {SERVICES.map((service) => (
                <div key={service.name} className="py-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-display text-lg font-semibold">{service.name}</p>
                    <Badge>{service.tag}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="pill" onClick={() => scrollToId('video-form', 'center')}>
                {landingHero?.cta_label ?? "SCARICA IL MINI CORSO GRATUITO"}
              </Button>
              <Button size="pill" variant="outline" onClick={() => scrollToId('method')}>
                Scopri il metodo
                <ArrowRight />
              </Button>
            </div>
          </div>

          {/* Browser chrome mockup */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/20">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
            </div>
            <div className="aspect-video w-full">
              {previewVideo ? (
                <VideoPlayer video={previewVideo} className="h-full w-full" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {MOSAIC_IMAGES.map((image) => (
                <img
                  key={image}
                  src={image}
                  alt=""
                  aria-hidden="true"
                  className="h-20 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Method / process — numbered steps */}
      <section id="method" className="border-t border-border py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Il metodo
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Cosa imparerai nel video
            </h2>
            <p className="mt-4 text-muted-foreground">
              Ti mostro, passo dopo passo, tutto quello che serve per creare un listino
              strategico e professionale.
            </p>
          </div>

          <div className="mt-16 divide-y divide-border border-y border-border">
            {METHOD_STEPS.map((step, stepIndex) => (
              <div
                key={step.index}
                className="grid gap-8 py-12 lg:grid-cols-12 lg:items-center"
              >
                <p className="font-display text-6xl font-semibold text-foreground/15 lg:col-span-2">
                  {step.index}
                </p>

                <ul className="space-y-3 lg:col-span-5">
                  {step.checks.map((check) => (
                    <li key={check} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-sm text-foreground/90">{check}</span>
                    </li>
                  ))}
                </ul>

                <div className="lg:col-span-5 lg:text-right">
                  <h3 className="font-display text-2xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.subtitle}</p>
                  <div className="mt-4 flex gap-3 lg:justify-end">
                    {STEP_IMAGES[stepIndex].map((image) => (
                      <img
                        key={image}
                        src={image}
                        alt=""
                        aria-hidden="true"
                        className="h-20 w-28 rounded-xl border border-border object-cover"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Button size="pill" onClick={() => scrollToId('video-form', 'center')}>
              <Download />
              {landingHero?.cta_label ?? "SCARICA IL MINI CORSO GRATUITO"}
            </Button>
          </div>
        </div>
      </section>

      {/* About statement band */}
      <section id="about" className="border-t border-border py-24">
        <div className="container mx-auto max-w-3xl px-6 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Chi siamo</p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Trasformiamo centri estetici in vere imprese.
          </h2>
          <p className="mt-6 text-muted-foreground">
            4 Elementi Italia è una realtà nata per trasformare i centri estetici e i
            professionisti del beauty in vere imprese consapevoli. Con oltre 10 anni di
            esperienza nel settore, uniamo formazione, strategia e strumenti digitali per
            supportare estetiste e professionisti del benessere nel loro percorso di
            crescita.
          </p>
          <p className="mt-4 text-muted-foreground">{heroParagraphs[1]}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            Collaboriamo con brand d'eccellenza come Tokio, Nee Make Up Milano ed
            Everlinespa, per garantire qualità, innovazione e prestigio.
          </p>
        </div>
      </section>

      {/* Testimonials — cream cards over a darker panel */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="rounded-3xl border border-border bg-card/40 p-8 lg:p-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Testimonianze
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">
                Cosa dicono di noi
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonialItems.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="flex h-full flex-col rounded-2xl bg-brand-cream p-6 text-brand-black shadow-lg shadow-black/30"
                >
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className="h-4 w-4 fill-brand-earth text-brand-earth"
                      />
                    ))}
                  </div>
                  <p className="mt-4 flex-grow text-sm leading-relaxed">
                    “{testimonial.quote}”
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">{testimonial.name}</p>
                      <p className="text-xs opacity-70">{testimonial.title}</p>
                    </div>
                  </div>
                  <p className="mt-4 flex items-center gap-1.5 text-xs opacity-70">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Cliente verificato
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA — dramatic centered section with the lead form */}
      <section id="contact" className="border-t border-border py-32">
        <div className="container mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tightest sm:text-5xl lg:text-6xl">
            {landingFinalCta?.title ?? "TRASFORMA IL TUO CENTRO ESTETICO IN UNA"}
            <span className="block">{landingFinalCta?.subtitle ?? "VERA IMPRESA"}</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            {landingFinalCta?.body ??
              "Se vuoi trasformare il tuo centro estetico in una vera impresa, sei nel posto giusto. ✨"}
          </p>

          <div className="mx-auto mt-12 max-w-md text-left">
            <h3 className="text-center font-display text-2xl font-semibold">
              {heroExtra.form_title ?? "SCARICA IL VIDEO GRATUITO"}
            </h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {heroExtra.form_subtitle ??
                "Compila il form e ricevi subito il link per scaricare il video completo"}
            </p>

            <form id="video-form" onSubmit={handleSubmit} className="mt-6 space-y-3">
              <Input
                placeholder="Il tuo nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Input
                type="email"
                placeholder="La tua email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  heroExtra.submit_loading_label ?? "INVIO IN CORSO..."
                ) : (
                  <>
                    <Download />
                    {heroExtra.submit_label ?? "SCARICA IL MINI CORSO GRATUITO"}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-foreground/5 p-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <p className="text-xs text-muted-foreground">
                {heroExtra.success_note ??
                  "Riceverai immediatamente un'email con il link per scaricare il video completo. Controlla anche la cartella spam!"}
              </p>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {heroExtra.form_disclaimer ??
                "✓ Nessun pagamento richiesto • Download immediato • Guarda quando vuoi"}
            </p>
          </div>

          <div className="mt-12">
            <p className="font-medium">
              {finalCtaExtra.closing_title ?? "Ti aspetto dall'altra parte!"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {finalCtaExtra.closing_subtitle ?? "Davide – Fondatore di 4 Elementi Italia"}
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter band */}
      <section className="border-t border-border py-20">
        <div className="container mx-auto grid gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {landingNewsletter?.title ?? "Sta per arrivare qualcosa di grande."}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {landingNewsletter?.body ??
                "Iscriviti ora per non perderti il lancio ufficiale della piattaforma e accedere in anteprima alla community riservata ai professionisti del settore."}
            </p>
            <ul className="mt-6 space-y-3">
              {newsletterBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-sm text-foreground/90">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg shadow-black/20">
            <h3 className="font-display text-xl font-semibold">
              {newsletterExtra.form_title ?? "👉 Iscriviti oggi. Sii tra i primi a entrare."}
            </h3>

            <form onSubmit={handleNewsletterSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="newsletter-name" className="mb-2 block">
                  {newsletterExtra.name_label ?? "Nome *"}
                </Label>
                <Input
                  id="newsletter-name"
                  type="text"
                  value={newsletterData.name}
                  onChange={(e) =>
                    setNewsletterData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={newsletterExtra.name_placeholder ?? "Il tuo nome"}
                  required
                  disabled={isSubmittingNewsletter}
                />
              </div>

              <div>
                <Label htmlFor="newsletter-email" className="mb-2 block">
                  {newsletterExtra.email_label ?? "Email *"}
                </Label>
                <Input
                  id="newsletter-email"
                  type="email"
                  value={newsletterData.email}
                  onChange={(e) =>
                    setNewsletterData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder={newsletterExtra.email_placeholder ?? "la.tua.email@esempio.com"}
                  required
                  disabled={isSubmittingNewsletter}
                />
              </div>

              <Button type="submit" disabled={isSubmittingNewsletter} className="w-full">
                {isSubmittingNewsletter
                  ? newsletterExtra.loading_label ?? "Iscrizione in corso..."
                  : landingNewsletter?.cta_label ?? 'ISCRIVITI ALLA NEWSLETTER'}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {newsletterExtra.privacy_note ??
                "Rispettiamo la tua privacy. Nessuno spam, solo contenuti di valore."}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <img
                  src="/4-elementi-logo.png"
                  alt="4 Elementi Italia Logo"
                  className="h-10 w-auto"
                />
                <span className="font-display text-lg font-semibold tracking-tight">
                  4 Elementi Italia
                </span>
              </div>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Formazione, community e strumenti gestionali per estetiste e professionisti
                del benessere.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Naviga</p>
              <ul className="mt-4 space-y-2">
                {navLinks.map((navLink) => (
                  <li key={navLink.href}>
                    <a
                      href={navLink.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {navLink.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Legale</p>
              <ul className="mt-4 space-y-2">
                {landingLegalLinks.map((link) => (
                  <li key={`${link.location}-${link.link_key}`}>
                    <a
                      href={link.url}
                      className="iubenda-white iubenda-noiframe iubenda-embed text-sm text-foreground/80 transition-colors hover:text-foreground hover:underline"
                      title={link.label}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground">
                {landingFooterExtra.recovery_text ?? "Hai perso l'email di accesso?"}{' '}
                <Button
                  variant="link"
                  onClick={() => navigate('/recupera-accesso')}
                  className="h-auto p-0 text-sm"
                >
                  {landingFooterExtra.recovery_cta ?? "Recupera qui"}
                </Button>
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {landingFooter?.body ?? "© 2024 4 Elementi Italia. Tutti i diritti riservati."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
