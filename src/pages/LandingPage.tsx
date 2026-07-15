import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Play,
  ChevronDown,
  ArrowRight,
  Star,
  Sparkles,
  BadgeCheck,
  Instagram,
  Facebook,
  Youtube,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getSiteVideo, SiteVideo } from "@/lib/siteVideos";
import VideoPlayer from "@/components/ui/VideoPlayer";
import {
  getLegalLinks,
  getSiteSections,
  getTestimonials,
  readSectionExtraObject,
  type LegalLinkRow,
  type SiteSectionRow,
  type TestimonialRow,
} from "@/lib/api/siteContent";

type LandingNewsletterExtra = {
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

// Warm, luminous beauty photography (full color — the UI stays monochrome)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=2000&q=80";

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

const NAV_LINKS = [
  { label: "La Piattaforma", href: "#piattaforma" },
  { label: "Il Metodo", href: "#metodo" },
  { label: "Testimonianze", href: "#testimonianze" },
  { label: "Contatti", href: "#contatti" },
];

const HERO_STATS: Array<[string, string]> = [
  ["132", "Centri attivi"],
  ["4", "Pilastri del metodo"],
  ["+40%", "Crescita media clientela"],
];

const BAND_STATS: Array<[string, string]> = [
  ["+40%", "Crescita media clientela"],
  ["132", "Centri che usano il metodo"],
  ["4", "Elementi del metodo"],
];

const PLATFORM_FEATURES = [
  {
    name: "Strumenti gestionali",
    tag: "Gestione",
    description:
      "Servizi, appuntamenti, inventario e KPI del tuo centro sempre sotto controllo.",
  },
  {
    name: "Formazione & Community",
    tag: "Crescita",
    description:
      "I corsi del metodo 4E e una community di professioniste con cui confrontarti.",
  },
  {
    name: "Assistente AI",
    tag: "AI",
    description: "Un assistente addestrato sul metodo 4E che ti guida ogni giorno.",
  },
];

const METHOD_STEPS = [
  {
    index: "1",
    title: "La Diagnosi",
    subtitle: "Da dove parti.",
    checks: ["Analisi di Valore", "Numeri del centro", "Obiettivi chiari"],
  },
  {
    index: "2",
    title: "Il Metodo",
    subtitle: "Come cresci.",
    checks: ["Organizzazione & protocolli", "Team formato", "Marketing costante"],
  },
  {
    index: "3",
    title: "Il Risultato",
    subtitle: "Dove arrivi.",
    checks: ["Più margine", "Clienti fidelizzati", "Un'impresa solida"],
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
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      const video = await getSiteVideo('preview');
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
        getSiteSections(["landing_newsletter", "landing_footer"]),
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

  const landingNewsletter = getSectionByKey(landingSections, "landing_newsletter");
  const landingFooter = getSectionByKey(landingSections, "landing_footer");
  const newsletterExtra = readSectionExtraObject<LandingNewsletterExtra>(landingNewsletter, {});
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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      toast({
        title: "Email obbligatoria",
        description: "Inserisci la tua email per iscriverti",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingNewsletter(true);
    try {
      const response = await supabase.functions.invoke('newsletter-subscribe', {
        body: {
          email,
          name: email.split('@')[0],
          source: 'footer_newsletter'
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Iscrizione completata!",
        description: "Ti sei iscritto con successo alla nostra newsletter. Riceverai presto contenuti esclusivi!",
      });

      setNewsletterEmail("");

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
      {/* 1) Navbar — transparent bar over the hero, centered menu from md up */}
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center px-6 py-5 md:grid-cols-[1fr_auto_1fr] md:px-10">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/4-elementi-logo.png"
              alt="4 Elementi Italia Logo"
              className="h-8 w-auto"
            />
            <span className="hidden font-display text-base font-semibold tracking-tight lg:block">
              4 Elementi Italia
            </span>
          </a>

          <nav className="hidden items-center justify-center gap-8 md:flex">
            {NAV_LINKS.map((navLink) => (
              <a
                key={navLink.href}
                href={navLink.href}
                className="text-sm text-foreground/80 transition-colors hover:text-foreground"
              >
                {navLink.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-2">
            <Button
              className="hidden h-10 px-4 md:inline-flex"
              onClick={() => navigate('/login')}
            >
              Area riservata
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="glass h-10 w-10 border-0 md:hidden"
              aria-label={mobileMenuOpen ? "Chiudi il menu" : "Apri il menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="px-6 md:hidden">
            <nav className="glass flex flex-col gap-1 rounded-2xl p-4">
              {NAV_LINKS.map((navLink) => (
                <a
                  key={navLink.href}
                  href={navLink.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  {navLink.label}
                </a>
              ))}
              <Button className="mt-2 h-10 w-full" onClick={() => navigate('/login')}>
                Area riservata
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* 2) Hero — text left, warm photo breathing on the right, floating glass cards */}
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden">
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

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-36 pt-40 md:px-10 lg:pb-44">
          <div className="max-w-2xl lg:max-w-[55%]">
            <p className="text-xs font-normal uppercase tracking-[0.18em] text-foreground/60">
              La piattaforma del metodo 4 Elementi
            </p>

            <h1 className="mt-6 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.05em] text-foreground sm:text-6xl md:text-7xl md:leading-none">
              Da estetista
              <span className="block">a imprenditrice.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/80 md:text-lg">
              La piattaforma 4 Elementi riunisce formazione, community, strumenti
              gestionali e un assistente AI per gestire e far crescere il tuo centro.
              Tutto in un unico posto.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button onClick={() => navigate('/login')}>
                Accedi alla piattaforma
              </Button>
              <Button
                variant="secondary"
                onClick={() => scrollToId('piattaforma')}
              >
                <Play />
                Guarda la demo
              </Button>
            </div>

            <p className="mt-10 text-xs uppercase tracking-[0.18em] text-foreground/60">
              Formazione — Community — Gestionale — Assistente AI
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
          <div className="glass rounded-2xl p-5">
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
          <div className="glass rounded-2xl p-4">
            <Badge className="glass border-0">
              <Sparkles className="h-3 w-3" />
              PIÙ RICHIESTO
            </Badge>
            <img
              src={MOSAIC_IMAGES[0]}
              alt="Analisi di Valore"
              className="mt-3 h-28 w-full rounded-xl object-cover"
            />
            <p className="mt-3 font-display text-base font-semibold">Analisi di Valore</p>
            <p className="text-xs text-muted-foreground">
              Diagnosi digitale del tuo centro
            </p>
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
                aria-label="Accedi alla piattaforma"
                onClick={() => navigate('/login')}
              >
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3) Scroll hint */}
      <div className="flex flex-col items-center gap-2 py-10">
        <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
          Scopri di più
        </p>
        <ChevronDown className="h-4 w-4 animate-bounce text-muted-foreground" />
      </div>

      {/* 4) Feature split — the platform */}
      <section id="piattaforma" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-6 md:px-10 lg:grid-cols-2">
          <div>
            <Badge className="glass border-0">
              <Sparkles className="h-3 w-3" />
              LA PIATTAFORMA
            </Badge>
            <h2 className="mt-6 font-display text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Tutto ciò che ti serve, in un posto
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Un unico ambiente digitale per gestire il tuo centro, formarti con il
              metodo 4E e farti accompagnare ogni giorno.
            </p>

            <div className="mt-8 divide-y divide-border border-y border-border">
              {PLATFORM_FEATURES.map((feature) => (
                <div key={feature.name} className="py-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-display text-lg font-semibold">{feature.name}</p>
                    <Badge>{feature.tag}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button variant="outline" onClick={() => scrollToId('metodo')}>
                Scopri di più
                <ArrowRight />
              </Button>
              <Button onClick={() => navigate('/login')}>
                Accedi
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

      {/* 5) Philosophy / method — numbered 1–3 */}
      <section id="metodo" className="border-t border-border py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <h2 className="font-display text-4xl font-semibold tracking-[-0.05em] sm:text-5xl md:text-6xl">
              Il Metodo 4 Elementi
            </h2>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] text-foreground/60">
              <Sparkles className="h-3 w-3" />
              Scopri il metodo
            </span>
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
        </div>
      </section>

      {/* 6) Community love — testimonials */}
      <section id="testimonianze" className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="rounded-3xl border border-border bg-card/40 p-8 lg:p-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
                Risultati veri
              </p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em]">
                Le nostre professioniste
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

      {/* 7) Stats band */}
      <section className="border-t border-border py-16 md:py-24">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
          <div className="grid gap-12 text-center sm:grid-cols-3">
            {BAND_STATS.map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-6xl font-semibold tracking-[-0.05em] sm:text-7xl">
                  {value}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8) Footer — dark rounded card */}
      <footer id="contatti" className="pb-6 pt-12">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-card p-8 md:p-12 lg:p-16">
          {/* Metallic sheen overlay (LUMINA) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.05),rgba(255,255,255,0),rgba(255,255,255,0.10))]"
          />
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/4-elementi-logo.png"
                  alt="4 Elementi Italia Logo"
                  className="h-10 w-auto"
                />
                <span className="font-display text-xl font-semibold tracking-tight">
                  4 Elementi Italia
                </span>
              </div>
              <p className="mt-4 max-w-sm text-muted-foreground">
                Entra nel percorso che trasforma il tuo centro in un'impresa.
              </p>

              <form
                onSubmit={handleNewsletterSubmit}
                className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <Input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="la.tua.email@esempio.com"
                  aria-label="Email per la newsletter"
                  required
                  disabled={isSubmittingNewsletter}
                />
                <Button type="submit" disabled={isSubmittingNewsletter} className="shrink-0">
                  {isSubmittingNewsletter ? "Invio..." : "Iscriviti"}
                </Button>
              </form>
              <p className="mt-3 text-xs text-muted-foreground">
                {newsletterExtra.privacy_note ??
                  "Rispettiamo la tua privacy. Nessuno spam, solo contenuti di valore."}
              </p>
            </div>

            <div className="grid gap-10 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
                  Piattaforma
                </p>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="#piattaforma" className="text-sm text-foreground/80 transition-colors hover:text-foreground">
                      La Piattaforma
                    </a>
                  </li>
                  <li>
                    <a href="#metodo" className="text-sm text-foreground/80 transition-colors hover:text-foreground">
                      Il Metodo
                    </a>
                  </li>
                  <li>
                    <a href="/login" className="text-sm text-foreground/80 transition-colors hover:text-foreground">
                      Formazione
                    </a>
                  </li>
                  <li>
                    <a href="/login" className="text-sm text-foreground/80 transition-colors hover:text-foreground">
                      Community
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
                  Azienda
                </p>
                <ul className="mt-4 space-y-2">
                  <li>
                    <a href="#metodo" className="text-sm text-foreground/80 transition-colors hover:text-foreground">
                      Chi siamo
                    </a>
                  </li>
                  <li>
                    <a href="#contatti" className="text-sm text-foreground/80 transition-colors hover:text-foreground">
                      Contatti
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
                  Legale
                </p>
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
                  <li>
                    <Button
                      variant="link"
                      onClick={() => navigate('/recupera-accesso')}
                      className="h-auto p-0 text-sm text-foreground/80 hover:text-foreground"
                    >
                      {landingFooterExtra.recovery_cta ?? "Recupera accesso"}
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              {landingFooter?.body ?? "© 2026 4 Elementi Italia. Tutti i diritti riservati."}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="glass h-9 w-9 border-0" aria-label="Instagram" asChild>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                  <Instagram />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="glass h-9 w-9 border-0" aria-label="Facebook" asChild>
                <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                  <Facebook />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="glass h-9 w-9 border-0" aria-label="YouTube" asChild>
                <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
                  <Youtube />
                </a>
              </Button>
            </div>
          </div>
        </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
