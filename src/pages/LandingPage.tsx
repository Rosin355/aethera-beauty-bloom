import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Droplets,
  Footprints,
  LineChart,
  Menu,
  Plus,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  getLegalLinks,
  getSiteSections,
  readSectionExtraObject,
  type LegalLinkRow,
  type SiteSectionRow,
} from "@/lib/api/siteContent";
import "@/styles/landing.css";

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

/* Warm, luminous beauty/wellness photography (full color) — same slot structure
   as the reference; swap these for the client's real photos without touching layout. */
const IMAGE_VARS = {
  "--base-image":
    "url('https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=2400&q=90')",
  "--reveal-image":
    "url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=2400&q=90')",
  "--section-ambient-image":
    "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2200&q=90')",
  "--section-floral-image":
    "url('https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=2200&q=90')",
  "--product-image-1":
    "url('https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1400&q=90')",
  "--product-image-2":
    "url('https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1400&q=90')",
  "--product-image-3":
    "url('https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1400&q=90')",
  "--vision-image":
    "url('https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1800&q=90')",
  "--story-image-1":
    "url('https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&w=1400&q=90')",
  "--story-image-2":
    "url('https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1400&q=90')",
  "--story-image-3":
    "url('https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?auto=format&fit=crop&w=1400&q=90')",
  "--story-image-4":
    "url('https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1400&q=90')",
  "--story-image-5":
    "url('https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1400&q=90')",
} as React.CSSProperties;

const NAV_LINKS = [
  { label: "Metodo", href: "#metodo" },
  { label: "Piattaforma", href: "#piattaforma" },
  { label: "Percorsi", href: "#percorsi" },
  { label: "FAQ", href: "#faq" },
];

const STORY_CHAPTERS = [
  {
    chapter: "Capitolo 01",
    title: "Formazione",
    copy: "Percorsi, video-lezioni e materiali del metodo 4E per te e per il tuo team.",
  },
  {
    chapter: "Capitolo 02",
    title: "Gestionale",
    copy: "Agenda, listino servizi, inventario e appuntamenti in un'unica vista.",
  },
  {
    chapter: "Capitolo 03",
    title: "Assistente AI",
    copy: "Un consulente formato sul metodo 4E, disponibile ogni giorno, a ogni domanda.",
  },
  {
    chapter: "Capitolo 04",
    title: "Community",
    copy: "Forum, confronto tra colleghe e opportunità di lavoro nel network 4 Elementi.",
  },
  {
    chapter: "Capitolo 05",
    title: "Numeri",
    copy: "Fatturato, scontrino medio e ritorno clienti sempre sotto controllo.",
  },
];

const CINEMA_STEPS = ["01 Diagnosi", "02 Metodo", "03 Strumenti", "04 Risultati"];

const GATHER_WORDS = [
  { word: "Ogni", x: -420, y: -210, r: -18 },
  { word: "strumento", x: 310, y: -170, r: 14 },
  { word: "riunito", x: -290, y: 150, r: 18 },
  { word: "in", x: 430, y: 110, r: -12 },
  { word: "una", x: -160, y: -95, r: 9 },
  { word: "sola", x: 220, y: 210, r: -16 },
  { word: "piattaforma", x: -360, y: 60, r: -10 },
];

const ARCHIVE_TILES = [
  { className: "archive-tile tall", col: 0, row: 0, img: "var(--story-image-1)" },
  { className: "archive-tile", col: 1, row: 0, img: "var(--product-image-1)" },
  { className: "archive-tile wide", col: 2, row: 0, img: "var(--section-floral-image)" },
  { className: "archive-tile", col: 4, row: 0, img: "var(--story-image-2)" },
  { className: "archive-tile", col: 1, row: 1, img: "var(--product-image-2)" },
  { className: "archive-tile tall", col: 2, row: 1, img: "var(--vision-image)" },
  { className: "archive-tile", col: 3, row: 1, img: "var(--story-image-3)" },
  { className: "archive-tile", col: 4, row: 1, img: "var(--product-image-3)" },
  { className: "archive-tile wide", col: 0, row: 2, img: "var(--story-image-4)" },
  { className: "archive-tile", col: 3, row: 2, img: "var(--story-image-5)" },
  { className: "archive-tile", col: 4, row: 2, img: "var(--section-ambient-image)" },
];

const PERCORSI = [
  {
    number: "No. 01",
    title: "Sette Passi",
    copy: "Da estetista a imprenditrice: il percorso completo del metodo 4 Elementi.",
    visualClass: "product-visual",
    Icon: Footprints,
  },
  {
    number: "No. 02",
    title: "Gestione & Numeri",
    copy: "Listino, KPI, organizzazione del team e controllo di gestione del centro.",
    visualClass: "product-visual base",
    Icon: LineChart,
  },
  {
    number: "No. 03",
    title: "AI & Marketing",
    copy: "L'intelligenza artificiale e le campagne al servizio della tua agenda piena.",
    visualClass: "product-visual solar",
    Icon: Bot,
  },
];

const ACTS = [
  {
    label: "Atto 01 / Diagnosi",
    title: "Si parte dal check-up.",
    copy: "Numeri, organizzazione e posizionamento del tuo centro, fotografati con onestà.",
  },
  {
    label: "Atto 02 / Metodo",
    title: "Concentrati sul lavoro, non sul caos.",
    copy: "Listino, protocolli, team e marketing costruiti sul modello 4 Elementi.",
  },
  {
    label: "Atto 03 / Crescita",
    title: "Risultati che restano.",
    copy: "KPI monitorati, clienti che tornano e un centro che cresce anche senza di te in cabina.",
  },
];

const FAQ_ITEMS = [
  {
    question: "È adatta anche a un centro piccolo?",
    answer:
      "Sì. Il metodo 4E nasce proprio per centri estetici e spa indipendenti: si parte dalla diagnosi e si cresce per passi.",
  },
  {
    question: "Devo essere esperta di strumenti digitali?",
    answer:
      "No. La piattaforma è guidata e l'assistente AI ti accompagna in ogni funzione, in italiano semplice.",
  },
  {
    question: "Cosa include l'assistente AI?",
    answer:
      "Un consulente formato sul metodo 4 Elementi: risponde su listino, organizzazione, marketing e gestione quotidiana del centro.",
  },
];

const MARQUEE_TAGS = ["Acqua", "Aria", "Fuoco", "Terra", "Metodo 4E", "Sette Passi"];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const sectionProgress = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  return clamp(-rect.top / scrollable, 0, 1);
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

const LandingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const reducedMotion = usePrefersReducedMotion();

  const [pageReady, setPageReady] = useState(false);
  const [introHidden, setIntroHidden] = useState(false);
  const [introRemoved, setIntroRemoved] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [leadData, setLeadData] = useState({ name: "", email: "" });
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);

  const [landingSections, setLandingSections] = useState<Record<string, SiteSectionRow>>({});
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

  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const revealLayerRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const storyTrackRef = useRef<HTMLDivElement>(null);
  const storyIndexRef = useRef<HTMLSpanElement>(null);
  const cinemaRef = useRef<HTMLElement>(null);
  const gatherRef = useRef<HTMLElement>(null);
  const archiveRef = useRef<HTMLElement>(null);

  /* ---------- CMS content (Supabase, wired as before) ---------- */
  useEffect(() => {
    let mounted = true;
    const loadCmsContent = async () => {
      const [sections, legalLinks] = await Promise.all([
        getSiteSections(["landing_newsletter", "landing_footer"]),
        getLegalLinks("landing_footer"),
      ]);
      if (!mounted) return;
      setLandingSections(sections);
      if (legalLinks.length > 0) {
        setLandingLegalLinks(legalLinks);
      }
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

  /* ---------- Loading intro ---------- */
  useEffect(() => {
    if (reducedMotion) {
      setPageReady(true);
      setIntroHidden(true);
      setIntroRemoved(true);
      return;
    }
    document.body.style.overflow = "hidden";
    const finish = window.setTimeout(() => {
      setPageReady(true);
      setIntroHidden(true);
      document.body.style.overflow = "";
    }, 1450);
    const remove = window.setTimeout(() => setIntroRemoved(true), 2600);
    return () => {
      window.clearTimeout(finish);
      window.clearTimeout(remove);
      document.body.style.overflow = "";
    };
  }, [reducedMotion]);

  /* ---------- Scroll reveals (IntersectionObserver) ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = root.querySelectorAll(".reveal, .text-mask, .image-mask");
    if (reducedMotion) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const parent = el.parentElement;
          if (el.classList.contains("stagger") && parent) {
            const index = Array.prototype.indexOf.call(parent.children, el);
            el.style.transitionDelay = `${Math.max(index, 0) * 90}ms`;
          }
          el.classList.add("in");
          observer.unobserve(el);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reducedMotion]);

  /* ---------- Hero cursor spotlight (reveal layer mask) ---------- */
  useEffect(() => {
    const layer = revealLayerRef.current;
    if (!layer) return;
    const drawMask = (cx: number, cy: number) => {
      const mask = `radial-gradient(ellipse 620px 500px at ${cx}px ${cy}px, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 30%, rgba(255,255,255,.82) 48%, rgba(255,255,255,.42) 68%, rgba(255,255,255,.12) 88%, rgba(255,255,255,0) 100%)`;
      layer.style.maskImage = mask;
      layer.style.webkitMaskImage = mask;
    };
    const restingPoint = () => ({
      x: window.innerWidth * 0.68,
      y: window.innerHeight * 0.44,
    });
    const initial = restingPoint();
    drawMask(initial.x, initial.y);
    // Touch / coarse-pointer devices and reduced-motion keep a static spotlight (no listener).
    const coarsePointer =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (reducedMotion || coarsePointer) return;

    const target = { ...initial };
    const current = { ...initial };
    let raf = 0;
    const onMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
    };
    const onLeave = () => {
      const resting = restingPoint();
      target.x = resting.x;
      target.y = resting.y;
    };
    const loop = () => {
      current.x += (target.x - current.x) * 0.095;
      current.y += (target.y - current.y) * 0.095;
      drawMask(current.x, current.y);
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  /* ---------- Global scroll motion (progress rail, story, cinema, gather, archive, parallax) ---------- */
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let ticking = false;

    const update = () => {
      ticking = false;

      const scrolled = window.scrollY > 18;
      if (scrolled !== hasScrolledRef.current) {
        hasScrolledRef.current = scrolled;
        setHasScrolled(scrolled);
      }

      if (reducedMotion) return;

      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const pageProgress = clamp(window.scrollY / maxScroll, 0, 1);
      railRef.current?.style.setProperty("--page-progress", pageProgress.toFixed(4));

      const hero = heroRef.current;
      if (hero) {
        const lightX = 56 + Math.sin(window.scrollY * 0.003) * 8;
        const lightY = 42 + Math.cos(window.scrollY * 0.002) * 5;
        hero.style.setProperty("--hero-light-x", `${lightX.toFixed(2)}%`);
        hero.style.setProperty("--hero-light-y", `${lightY.toFixed(2)}%`);
      }

      const desktop = window.innerWidth > 900;

      const story = storyRef.current;
      if (story) {
        const p = sectionProgress(story);
        story.style.setProperty("--story-progress", p.toFixed(4));
        story.style.setProperty("--story-light-x", `${(44 + p * 34).toFixed(1)}%`);
        const track = storyTrackRef.current;
        if (track && desktop) {
          const x = -p * Math.max(0, track.scrollWidth - window.innerWidth * 0.48);
          track.style.transform = `translate3d(${x}px,0,0)`;
        }
        const bg = story.querySelector<HTMLElement>(".story-bg");
        const bgReveal = story.querySelector<HTMLElement>(".story-bg-reveal");
        if (bg) {
          bg.style.transform = `translate3d(${p * -70}px,${p * -22}px,0) scale(${1.06 + p * 0.08})`;
        }
        if (bgReveal) {
          bgReveal.style.transform = `translate3d(${p * 90}px,${p * 26}px,0) scale(${1.1 + p * 0.12})`;
          bgReveal.style.opacity = String(0.1 + p * 0.28);
        }
        const cards = story.querySelectorAll<HTMLElement>(".story-card");
        const focus = clamp(Math.round(p * (cards.length - 1)), 0, cards.length - 1);
        cards.forEach((card, index) => {
          card.classList.toggle("is-focus", index === focus);
          card.style.setProperty("--card-r", `${((index - focus) * -2.8).toFixed(2)}deg`);
        });
        const step = clamp(Math.floor(p * STORY_CHAPTERS.length), 0, STORY_CHAPTERS.length - 1);
        if (storyIndexRef.current) {
          storyIndexRef.current.textContent = String(step + 1).padStart(2, "0");
        }
        story.querySelectorAll<HTMLElement>(".story-title .story-word").forEach((word, index) => {
          const local = clamp(p * 1.3 - index * 0.12, 0, 1);
          word.style.setProperty("--word-y", `${((1 - local) * 16).toFixed(2)}px`);
          word.style.setProperty("--word-o", (0.55 + local * 0.45).toFixed(3));
        });
      }

      const cinema = cinemaRef.current;
      if (cinema) {
        const p = sectionProgress(cinema);
        cinema.style.setProperty("--cinema-progress", p.toFixed(4));
        const steps = cinema.querySelectorAll<HTMLElement>(".cinema-step");
        const active = clamp(Math.floor(p * steps.length), 0, steps.length - 1);
        steps.forEach((stepEl, index) => {
          stepEl.classList.toggle("is-active", index === active);
        });
      }

      const gather = gatherRef.current;
      if (gather) {
        const p = sectionProgress(gather);
        const eased = 1 - Math.pow(1 - p, 3);
        gather.style.setProperty("--gather-ghost-y", `${(-28 * eased).toFixed(1)}px`);
        gather.style.setProperty("--gather-ghost-opacity", (0.8 - eased * 0.45).toFixed(3));
        gather.style.setProperty("--gather-glow-scale", (0.72 + eased * 0.45).toFixed(3));
        gather.style.setProperty("--gather-glow-opacity", (0.28 + eased * 0.35).toFixed(3));
        gather.style.setProperty("--gather-support-opacity", (0.2 + eased * 0.8).toFixed(3));
        gather.style.setProperty("--gather-support-y", `${((1 - eased) * 18).toFixed(1)}px`);
        gather.style.setProperty("--gather-cursor-left", `${(18 + eased * 64).toFixed(2)}%`);
        gather.style.setProperty("--gather-cursor-top", `${(78 - eased * 58).toFixed(2)}%`);
        gather.querySelectorAll<HTMLElement>(".gather-line span").forEach((word) => {
          const x = Number(word.dataset.x || 0) * (1 - eased);
          const y = Number(word.dataset.y || 0) * (1 - eased);
          const r = Number(word.dataset.r || 0) * (1 - eased);
          word.style.setProperty("--tx", `${x.toFixed(1)}px`);
          word.style.setProperty("--ty", `${y.toFixed(1)}px`);
          word.style.setProperty("--rot", `${r.toFixed(1)}deg`);
          word.style.setProperty("--scale", (0.78 + eased * 0.22).toFixed(3));
          word.style.setProperty("--word-opacity", String(0.28 + eased * 0.72));
          word.style.setProperty("--word-blur", `${((1 - eased) * 2.6).toFixed(2)}px`);
        });
      }

      const archive = archiveRef.current;
      if (archive) {
        const p = sectionProgress(archive);
        const eased = 1 - Math.pow(1 - p, 3);
        archive.style.setProperty("--archive-word-x", `${(-8 * eased).toFixed(2)}vw`);
        archive.style.setProperty("--archive-word-opacity", (0.75 - eased * 0.35).toFixed(3));
        archive.style.setProperty("--archive-radius", `${(8 + eased * 18).toFixed(1)}px`);
        archive.style.setProperty("--archive-progress-width", `${(eased * 100).toFixed(2)}%`);
        archive.style.setProperty("--tile-img-scale", (1.2 - eased * 0.08).toFixed(3));
        archive.style.setProperty("--tile-gray", (1 - eased).toFixed(3));
        archive.style.setProperty("--tile-overlay-opacity", (0.65 - eased * 0.35).toFixed(3));
        const grid = archive.querySelector<HTMLElement>(".archive-grid");
        grid?.style.setProperty("--archive-scale", (0.48 + eased * 0.52).toFixed(3));
        archive.querySelectorAll<HTMLElement>(".archive-tile").forEach((tile, index) => {
          const col = Number(tile.dataset.col || 0);
          const row = Number(tile.dataset.row || 0);
          const fromX = (2 - col) * 138;
          const fromY = (1 - row) * 124;
          const delay = Math.min(0.18, index * 0.012);
          const local = clamp((eased - delay) / (1 - delay), 0, 1);
          tile.style.setProperty("--tile-x", `${(fromX * (1 - local)).toFixed(1)}px`);
          tile.style.setProperty("--tile-y", `${(fromY * (1 - local)).toFixed(1)}px`);
          tile.style.setProperty("--tile-scale", (0.58 + local * 0.42).toFixed(3));
          tile.style.setProperty("--tile-opacity", String(0.18 + local * 0.82));
        });
      }

      const viewport = window.innerHeight || 1;
      root.querySelectorAll<HTMLElement>(".parallax-media").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport;
        const y = clamp(progress * -42, -36, 36);
        el.style.transform = `translate3d(0,${y}px,0) scale(1.06)`;
      });
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  /* ---------- Anchors ---------- */
  const scrollToAnchor = (
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    id: string,
  ) => {
    event.preventDefault();
    setMobileMenuOpen(false);
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    // Move keyboard focus to the target so sequential focus continues from there.
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  /* ---------- Lead capture (existing mailing-list-signup flow) ---------- */
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.name.trim() || !leadData.email.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci nome e email per continuare",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingLead(true);
    try {
      const response = await supabase.functions.invoke("mailing-list-signup", {
        body: {
          name: leadData.name.trim(),
          email: leadData.email.trim(),
          source: "hero_section",
        },
      });

      if (response.error) {
        if (response.error.message?.includes("già registrata")) {
          const { data: existingData } = await supabase
            .from("mailing_list")
            .select("access_token")
            .eq("email", leadData.email.trim())
            .single();

          if (existingData?.access_token) {
            toast({
              title: "Accesso trovato!",
              description:
                "Ti stiamo reindirizzando alla tua area riservata. Email di promemoria inviata!",
            });
            setTimeout(() => {
              window.location.href = `/welcome?token=${existingData.access_token}`;
            }, 1000);
            return;
          }
        }
        throw new Error(response.error.message || "Errore durante la registrazione");
      }

      const data = response.data;
      if (data?.access_token) {
        const emailStatus = data.email_sent
          ? "Email di benvenuto inviata!"
          : "Registrazione completata (email in sospeso)";
        toast({
          title: "Perfetto! 🎉",
          description: emailStatus + " Ti stiamo reindirizzando...",
        });
        setTimeout(() => {
          window.location.href = `/welcome?token=${data.access_token}`;
        }, 1500);
      }
    } catch (error) {
      console.error("Errore durante la registrazione:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore. Riprova tra qualche minuto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingLead(false);
    }
  };

  /* ---------- Newsletter (existing newsletter-subscribe flow) ---------- */
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      toast({
        title: "Email obbligatoria",
        description: "Inserisci la tua email per iscriverti",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingNewsletter(true);
    try {
      const response = await supabase.functions.invoke("newsletter-subscribe", {
        body: {
          email,
          name: email.split("@")[0],
          source: "footer_newsletter",
        },
      });
      if (response.error) {
        throw response.error;
      }
      toast({
        title: "Iscrizione completata!",
        description:
          "Ti sei iscritto con successo alla nostra newsletter. Riceverai presto contenuti esclusivi!",
      });
      setNewsletterEmail("");
    } catch (error) {
      console.error("Errore durante l'iscrizione alla newsletter:", error);
      const errorMessage =
        error instanceof Error && error.message?.includes("Email già iscritta")
          ? "Questa email è già iscritta alla newsletter"
          : "Si è verificato un errore. Riprova tra qualche minuto.";
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  const rootClasses = [
    "landing-root",
    "min-h-screen",
    pageReady ? "page-ready" : "",
    hasScrolled ? "has-scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={rootClasses} style={IMAGE_VARS}>
      {/* Loading intro */}
      {!introRemoved && (
        <div className={`landing-intro ${introHidden ? "hide" : ""}`} aria-hidden="true">
          <div className="landing-intro-inner">
            <div className="load-mark">4E</div>
            <div className="load-kicker">4 Elementi Italia</div>
            <div className="load-brand">Aethera</div>
            <div className="load-line">
              <span></span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll progress rail */}
      <div ref={railRef} className="scroll-rail" aria-hidden="true">
        <span></span>
      </div>

      {/* Floating nav */}
      <nav
        className="floating-nav fixed left-1/2 top-5 z-[100] flex w-[calc(100%-32px)] max-w-6xl -translate-x-1/2 items-center justify-between rounded-full border border-white/15 bg-black/35 px-4 py-3 backdrop-blur-2xl sm:px-5 md:px-6"
        aria-label="Navigazione principale"
      >
        <a href="/" className="group flex items-center gap-3 text-white" aria-label="Aethera — home">
          <img
            src="/4-elementi-logo.png"
            alt="Logo 4 Elementi Italia"
            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="flex flex-col leading-none">
            <span className="font-playfair text-2xl italic tracking-tight">Aethera</span>
            <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.28em] text-white/75 sm:block">
              4 Elementi Italia
            </span>
          </span>
        </a>

        <div
          className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2 py-2 md:flex"
          aria-label="Sezioni della pagina"
        >
          {NAV_LINKS.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => scrollToAnchor(e, link.href.slice(1))}
              className={
                index === 0
                  ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm"
                  : "rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              }
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#cta"
          onClick={(e) => scrollToAnchor(e, "cta")}
          className="hidden rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-300 hover:border-white/40 hover:bg-white/20 md:inline-flex"
        >
          Richiedi accesso
        </a>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl md:hidden"
          type="button"
          aria-label={mobileMenuOpen ? "Chiudi il menu" : "Apri il menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-24 z-[99] md:hidden">
          <div className="glass-card rounded-3xl border border-white/12 p-4">
            <nav className="flex flex-col gap-1" aria-label="Menu mobile">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollToAnchor(e, link.href.slice(1))}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#cta"
                onClick={(e) => scrollToAnchor(e, "cta")}
                className="mt-2 rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-black"
              >
                Richiedi accesso
              </a>
            </nav>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-black">
        {/* ---------- HERO ---------- */}
        <section
          ref={heroRef}
          className="relative h-screen w-full overflow-hidden bg-black"
          style={{ height: "100dvh" }}
          aria-label="Aethera — piattaforma del metodo 4 Elementi"
        >
          <div className="hero-base absolute inset-0 z-10"></div>
          <div
            ref={revealLayerRef}
            className="hero-reveal-layer pointer-events-none absolute inset-0 z-[42]"
            aria-hidden="true"
          ></div>

          <div className="hero-scrim pointer-events-none absolute inset-0 z-40" aria-hidden="true"></div>
          <div
            className="hero-bottom-mask pointer-events-none absolute inset-x-0 bottom-0 z-[45] h-[62vh]"
            aria-hidden="true"
          ></div>

          <div className="pointer-events-none absolute inset-0 z-50 flex items-end px-5 pb-10 pt-28 sm:px-8 sm:pb-12 md:px-12 lg:pb-14">
            <div className="w-full">
              <div className="flex min-h-0 flex-col justify-end gap-5 lg:max-w-[660px]">
                <div
                  className="hero-anim hero-fade flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]"
                  style={{ animationDelay: ".18s" }}
                >
                  <span className="h-px w-14 bg-[#bfeeff]"></span>
                  Aethera 01 · Metodo 4 Elementi
                </div>
                <h1 className="leading-[0.88] text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.85)]">
                  <span
                    className="hero-anim hero-reveal-text block text-5xl font-medium sm:text-6xl md:text-7xl lg:text-[6.6rem]"
                    style={{ letterSpacing: "-.08em", animationDelay: ".25s" }}
                  >
                    La bellezza
                  </span>
                  <span
                    className="hero-anim hero-reveal-text font-playfair -mt-1 block text-5xl font-normal italic sm:text-6xl md:text-7xl lg:text-[6.6rem]"
                    style={{ letterSpacing: "-.06em", animationDelay: ".42s" }}
                  >
                    diventa impresa
                  </span>
                </h1>
                <div className="hero-anim hero-fade max-w-[560px]" style={{ animationDelay: ".68s" }}>
                  <p className="max-w-[470px] text-sm leading-relaxed text-white drop-shadow-[0_3px_22px_rgba(0,0,0,0.95)] sm:text-base md:text-lg">
                    La piattaforma che unisce formazione, gestionale e intelligenza
                    artificiale per estetiste e centri estetici che vogliono crescere
                    con metodo.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <a
                      href="#metodo"
                      onClick={(e) => scrollToAnchor(e, "metodo")}
                      className="pointer-events-auto w-fit rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-all hover:scale-[1.03] hover:bg-[#effbff] hover:shadow-lg hover:shadow-[#bfeeff]/25 active:scale-95"
                    >
                      Scopri il metodo
                    </a>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="pointer-events-auto w-fit rounded-full border border-white/30 bg-transparent px-7 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:border-white/55 hover:bg-white/10 active:scale-95"
                    >
                      Entra in piattaforma
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside
            className="hero-anim hero-fade pointer-events-auto absolute bottom-8 right-5 z-50 hidden max-w-[330px] border-r border-white/25 pr-5 text-right text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.8)] sm:bottom-10 sm:right-8 md:bottom-12 md:right-12 lg:block"
            style={{ animationDelay: ".82s" }}
          >
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#bfeeff]">
              Agenda intelligente
            </p>
            <p className="ml-auto text-sm leading-relaxed text-white/80">
              Servizi, appuntamenti e scorte in un'unica vista, senza fogli sparsi.
            </p>
            <div className="ml-auto mt-5 grid max-w-[260px] grid-cols-2 gap-4 border-t border-white/15 pt-4">
              <div>
                <p className="text-2xl font-semibold text-white">4</p>
                <p className="mt-1 text-xs text-white/50">elementi, un solo metodo</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">7</p>
                <p className="mt-1 text-xs text-white/50">passi da estetista a imprenditrice</p>
              </div>
            </div>
          </aside>
          <div
            className="vertical-label hero-anim hero-fade pointer-events-none absolute bottom-10 left-4 z-50 hidden text-[10px] font-semibold uppercase tracking-[0.26em] text-white/50 md:block"
            style={{ animationDelay: ".95s" }}
          >
            AETHERA / 4 ELEMENTI ITALIA
          </div>
        </section>

        <div className="site-bg text-white">
          <div className="content-layer">
            {/* ---------- STORY SCROLL ---------- */}
            <section ref={storyRef} className="story-scroll" aria-label="I capitoli della piattaforma">
              <div className="story-sticky">
                <div className="story-bg" aria-hidden="true"></div>
                <div className="story-bg-reveal" aria-hidden="true"></div>
                <div className="story-vignette" aria-hidden="true"></div>
                <div className="story-grid" aria-hidden="true"></div>
                <div className="story-orbit" aria-hidden="true"></div>

                <div className="story-shell">
                  <div className="story-kicker">Sequenza capitoli</div>
                  <div className="story-count">
                    <span ref={storyIndexRef}>01</span> / 05
                  </div>
                  <h2 className="story-title">
                    <span className="story-word">Il</span>{" "}
                    <span className="story-word">centro</span>{" "}
                    <em className="story-word">cresce</em>{" "}
                    <span className="story-word">con</span>{" "}
                    <span className="story-word">metodo.</span>
                  </h2>

                  <div
                    className="story-stage"
                    tabIndex={0}
                    role="group"
                    aria-label="Capitoli della piattaforma — scorri orizzontalmente"
                  >
                    <div ref={storyTrackRef} className="story-track">
                      {STORY_CHAPTERS.map((chapter, index) => (
                        <article key={chapter.title} className={`story-card ${index % 2 === 1 ? "alt" : ""}`}>
                          <div className="story-card-content">
                            <small>{chapter.chapter}</small>
                            <h3>{chapter.title}</h3>
                            <p>{chapter.copy}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="story-progress" aria-hidden="true">
                    <span></span>
                  </div>
                </div>
              </div>
            </section>

            <div className="section-line mx-auto h-px max-w-6xl"></div>

            {/* ---------- LA PIATTAFORMA ---------- */}
            <section id="piattaforma" className="relative mx-auto max-w-6xl px-5 py-28 sm:px-8 md:py-40">
              <div className="grid gap-12 lg:grid-cols-[.95fr_1.05fr] lg:items-end">
                <div>
                  <p className="eyebrow reveal">
                    <span className="eyebrow-line"></span> La piattaforma
                  </p>
                  <h2
                    className="mt-8 max-w-4xl text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl md:text-6xl lg:text-[4.6rem]"
                    style={{ letterSpacing: "-.055em" }}
                  >
                    <span className="text-mask">
                      <span>Costruiamo strumenti</span>
                    </span>
                    <span className="text-mask">
                      <span>per far crescere</span>
                    </span>
                    <span className="text-mask font-playfair font-normal italic text-white/90">
                      <span>il tuo centro.</span>
                    </span>
                  </h2>
                </div>
                <div className="reveal glass-card rounded-[2rem] border border-white/10 p-6 sm:p-8">
                  <p className="text-base leading-relaxed text-white/65 md:text-lg">
                    Aethera è pensata per i centri estetici moderni: ogni funzione nasce
                    per farti risparmiare tempo, dalla gestione dell'agenda alla
                    fidelizzazione delle clienti, e per rimettere te al centro
                    dell'impresa.
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
                    <div>
                      <p className="font-playfair text-4xl italic">04</p>
                      <p className="mt-2 text-xs uppercase tracking-[.18em] text-white/40">Elementi</p>
                    </div>
                    <div>
                      <p className="font-playfair text-4xl italic">07</p>
                      <p className="mt-2 text-xs uppercase tracking-[.18em] text-white/40">Passi</p>
                    </div>
                    <div>
                      <p className="font-playfair text-4xl italic">24/7</p>
                      <p className="mt-2 text-xs uppercase tracking-[.18em] text-white/40">Assistente AI</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------- SCROLL CINEMA ---------- */}
            <section ref={cinemaRef} className="scroll-cinema" aria-label="Dalla diagnosi alla crescita">
              <div className="cinema-sticky">
                <div className="cinema-bg" aria-hidden="true"></div>
                <div className="cinema-grid" aria-hidden="true"></div>
                <div className="cinema-shell">
                  <div className="cinema-copy">
                    <p className="cinema-kicker">Sequenza in scorrimento</p>
                    <h2 className="cinema-title">
                      Dalla diagnosi <em>alla crescita.</em>
                    </h2>
                    <p className="cinema-desc">
                      Un percorso completo: Aethera accompagna tutto il ciclo di vita del
                      tuo centro, così tu puoi concentrarti sulla cabina e sulle clienti.
                    </p>
                  </div>
                  <div className="cinema-stage">
                    <div className="cinema-frame one">
                      <span>Check-up del centro</span>
                    </div>
                    <div className="cinema-frame two">
                      <span>Metodo 4E</span>
                    </div>
                    <div className="cinema-frame three">
                      <span>Crescita misurabile</span>
                    </div>
                  </div>
                </div>
                <div className="cinema-steps" aria-hidden="true">
                  {CINEMA_STEPS.map((step, index) => (
                    <div key={step} className={`cinema-step ${index === 0 ? "is-active" : ""}`}>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ---------- GATHER ---------- */}
            <section ref={gatherRef} className="gather-scroll" aria-label="Una sola piattaforma">
              <div className="gather-sticky">
                <div className="gather-ghost" aria-hidden="true">
                  FORMAZIONE GESTIONALE AI COMMUNITY AGENDA KPI TEAM
                </div>
                <div className="gather-glow" aria-hidden="true"></div>
                <div className="gather-cursor-dot" aria-hidden="true"></div>
                <div className="gather-content">
                  <p className="gather-kicker">Sistema completo</p>
                  <h2 className="gather-line" aria-label="Ogni strumento riunito in una sola piattaforma">
                    {GATHER_WORDS.map(({ word, x, y, r }) => (
                      <span key={word} data-x={x} data-y={y} data-r={r}>
                        {word}
                      </span>
                    ))}
                  </h2>
                  <p className="gather-support">
                    Tutto ciò che serve per gestire il tuo centro estetico o la tua spa,
                    unito in un'unica suite semplice da usare.
                  </p>
                </div>
              </div>
            </section>

            {/* ---------- FEATURE ARCHIVE ---------- */}
            <section ref={archiveRef} className="archive-expand-scroll" aria-label="Archivio funzioni">
              <div className="archive-sticky">
                <div className="archive-word" aria-hidden="true">
                  FUNZIONI
                </div>
                <div className="archive-grid" aria-hidden="true">
                  {ARCHIVE_TILES.map((tile, index) => (
                    <div
                      key={index}
                      className={tile.className}
                      data-col={tile.col}
                      data-row={tile.row}
                      style={{ "--tile-img": tile.img } as React.CSSProperties}
                    ></div>
                  ))}
                </div>
                <div className="archive-meta">
                  <span>Archivio funzioni / 2026</span>
                  Un solo sistema diventa il motore del tuo centro: dalla prima
                  prenotazione al riacquisto, la parte amministrativa la gestiamo noi.
                </div>
                <div className="archive-progress" aria-hidden="true">
                  <span></span>
                </div>
              </div>
            </section>

            <div className="section-line mx-auto h-px max-w-6xl"></div>

            {/* ---------- I PERCORSI ---------- */}
            <section id="percorsi" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-32">
              <div className="reveal flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">
                    <span className="eyebrow-line"></span> I percorsi
                  </p>
                  <h2
                    className="mt-6 text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl"
                    style={{ letterSpacing: "-.055em" }}
                  >
                    Tre strade, <span className="font-playfair font-normal italic">un metodo</span>
                  </h2>
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-white/55">
                  Percorsi numerati dentro un unico metodo: scegli da dove iniziare, la
                  direzione è la stessa.
                </p>
              </div>

              <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
                {PERCORSI.map(({ number, title, copy, visualClass, Icon }, index) => (
                  <article
                    key={number}
                    className={`reveal stagger magnetic-card glass-card group overflow-hidden rounded-[2rem] border border-white/10 p-3 ${
                      index === 1 ? "md:translate-y-10" : ""
                    }`}
                  >
                    <div
                      className={`${visualClass} image-mask h-72 rounded-[1.55rem] border border-white/10`}
                      role="img"
                      aria-label={`Percorso ${title} del metodo 4 Elementi`}
                    ></div>
                    <div className="p-5">
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[.26em] text-white/40">
                          {number}
                        </span>
                        <Icon className="h-6 w-6 text-[#bfeeff]" aria-hidden="true" />
                      </div>
                      <h3 className="font-playfair text-4xl italic">{title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-white/55">{copy}</p>
                      <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                        <span className="text-[10px] font-bold uppercase tracking-[.2em] text-white/40">
                          Percorso 4E
                        </span>
                        <a
                          href="#cta"
                          onClick={(e) => scrollToAnchor(e, "cta")}
                          className="text-sm text-white/55 transition-colors group-hover:text-[#bfeeff]"
                        >
                          Scopri →
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* ---------- IL METODO ---------- */}
            <section id="metodo" className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-36">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-16">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1800&q=90"
                    alt="Trattamento viso durante un percorso del metodo 4 Elementi"
                    className="parallax-media image-mask h-[520px] w-full object-cover object-center md:h-[680px]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.24em] text-white/70">
                    <span>Metodo 4 Elementi</span>
                    <span>Diagnosi · Crescita</span>
                  </div>
                </div>
                <div>
                  <p className="eyebrow reveal">
                    <span className="eyebrow-line"></span> Il metodo
                  </p>
                  <h2
                    className="mt-7 text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
                    style={{ letterSpacing: "-.055em" }}
                  >
                    <span className="text-mask">
                      <span>Pensato come un</span>
                    </span>
                    <span className="text-mask font-playfair font-normal italic">
                      <span>equilibrio</span>
                    </span>
                    <span className="text-mask">
                      <span>tra corpo, mente e natura.</span>
                    </span>
                  </h2>
                  <p className="reveal mt-7 text-base leading-relaxed text-white/60 md:text-lg">
                    Ogni percorso 4 Elementi parte da una diagnosi reale del centro:
                    numeri, organizzazione, posizionamento. Da lì il metodo costruisce,
                    strato dopo strato, un'impresa che ti somiglia e che funziona anche
                    quando non sei in cabina.
                  </p>
                  <div className="mt-9 space-y-5">
                    <div className="reveal flex gap-4">
                      <Droplets className="mt-0.5 h-6 w-6 shrink-0 text-[#bfeeff]" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">Quattro elementi</p>
                        <p className="mt-1 text-sm text-white/55">
                          Acqua, Aria, Fuoco e Terra: le quattro dimensioni del tuo centro.
                        </p>
                      </div>
                    </div>
                    <div className="reveal flex gap-4">
                      <Footprints className="mt-0.5 h-6 w-6 shrink-0 text-[#bfeeff]" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">Sette passi</p>
                        <p className="mt-1 text-sm text-white/55">
                          Un percorso numerato, dalla diagnosi allo sviluppo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="section-line mx-auto h-px max-w-6xl"></div>

            {/* ---------- ARCHITETTURA DEL PERCORSO ---------- */}
            <section className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-36">
              <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
                <div className="lg:sticky lg:top-32">
                  <p className="eyebrow reveal">
                    <span className="eyebrow-line"></span> Architettura del percorso
                  </p>
                  <h2
                    className="mt-7 text-4xl font-medium leading-[1.04] tracking-tight sm:text-5xl md:text-6xl"
                    style={{ letterSpacing: "-.055em" }}
                  >
                    Un percorso perfetto in{" "}
                    <span className="font-playfair font-normal italic">tre atti.</span>
                  </h2>
                  <p className="reveal mt-6 max-w-md text-sm leading-relaxed text-white/60">
                    Abbiamo strutturato l'intero ciclo di crescita, così nessun passaggio
                    va perso.
                  </p>
                </div>
                <div className="space-y-5">
                  {ACTS.map((act) => (
                    <div key={act.label} className="reveal glass-card rounded-[2rem] border border-white/10 p-7 md:p-9">
                      <p className="text-[10px] font-bold uppercase tracking-[.26em] text-[#bfeeff]">
                        {act.label}
                      </p>
                      <h3 className="mt-5 text-3xl font-medium tracking-tight">{act.title}</h3>
                      <p className="mt-4 text-sm leading-relaxed text-white/55">{act.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="section-line mx-auto h-px max-w-6xl"></div>

            {/* ---------- DIARIO 4E ---------- */}
            <section className="field-notes-premium relative mx-auto max-w-6xl px-5 py-24 sm:px-8 md:py-36">
              <div className="reveal flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="eyebrow">
                    <span className="eyebrow-line"></span> Diario 4E
                  </p>
                  <h2
                    className="mt-7 max-w-4xl text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl md:text-7xl"
                    style={{ letterSpacing: "-.065em" }}
                  >
                    Dal <span className="font-playfair font-normal italic">diario</span> del metodo
                  </h2>
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-white/60">
                  Appunti, strumenti e riflessioni dal lavoro quotidiano con i centri
                  estetici.
                </p>
              </div>

              <div className="field-editorial-grid mt-14">
                <a
                  href="#cta"
                  onClick={(e) => scrollToAnchor(e, "cta")}
                  className="field-feature-card reveal group"
                  aria-label="Leggi la nota in evidenza: il prezzo giusto non è un numero, è un metodo"
                >
                  <div className="field-feature-media" aria-hidden="true"></div>
                  <div className="field-feature-content">
                    <div className="field-tag-row">
                      <span className="field-tag">In evidenza</span>
                      <span className="field-tag">Listino · 6 min</span>
                    </div>
                    <h3 className="field-feature-title">
                      Il prezzo giusto non è un numero, è <em>un metodo</em>
                    </h3>
                    <p className="field-feature-copy">
                      Come costruire un listino che valorizza il tuo lavoro senza
                      rincorrere gli sconti.
                    </p>
                    <div className="field-feature-footer">
                      <span className="text-[10px] font-bold uppercase tracking-[.24em] text-white/50">
                        Diario 4E / 2026
                      </span>
                      <span className="field-read-link">
                        Leggi la nota
                        <span aria-hidden="true">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </span>
                    </div>
                  </div>
                </a>

                <div className="field-side-stack">
                  <a
                    href="#cta"
                    onClick={(e) => scrollToAnchor(e, "cta")}
                    className="field-note-card reveal group"
                  >
                    <div className="field-note-meta">
                      <span>Team · 4 min</span>
                      <span className="field-note-number">02</span>
                    </div>
                    <h3 className="field-note-title">Da sola non si scala: organizzare il centro</h3>
                    <p className="field-note-copy">
                      Ruoli, regole e organigramma per un team che funziona.
                    </p>
                    <div className="mt-6">
                      <span className="field-read-link">
                        Leggi la nota
                        <span aria-hidden="true">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </span>
                    </div>
                  </a>

                  <a
                    href="#cta"
                    onClick={(e) => scrollToAnchor(e, "cta")}
                    className="field-note-card reveal group"
                  >
                    <div className="field-note-meta">
                      <span>Visione · 8 min</span>
                      <span className="field-note-number">03</span>
                    </div>
                    <h3 className="field-note-title">L'estetista che diventa imprenditrice</h3>
                    <p className="field-note-copy">
                      Il salto di mentalità dietro i sette passi del metodo.
                    </p>
                    <div className="mt-6">
                      <span className="field-read-link">
                        Leggi la nota
                        <span aria-hidden="true">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </span>
                    </div>
                  </a>

                  <div className="field-mini-grid reveal">
                    <div className="field-mini-card">
                      <strong>04</strong>
                      <span>Elementi</span>
                    </div>
                    <div className="field-mini-card">
                      <strong>07</strong>
                      <span>Passi</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="field-marquee reveal" aria-hidden="true">
                <div className="field-marquee-track">
                  {[...MARQUEE_TAGS, ...MARQUEE_TAGS].map((tag, index) => (
                    <span key={`${tag}-${index}`}>{tag}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* ---------- FINAL CTA ---------- */}
            <section id="cta" className="relative mx-auto max-w-6xl px-5 py-28 sm:px-8 md:py-40">
              <div className="reveal soft-panel relative overflow-hidden rounded-[2.4rem] border border-white/10 px-7 py-16 text-center shadow-[0_40px_120px_rgba(0,0,0,.55)] sm:px-12 md:py-28">
                <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#bfeeff]/60 to-transparent"></div>
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#bfeeff]/10 blur-3xl"></div>
                <p className="text-[11px] font-bold uppercase tracking-[.26em] text-[#bfeeff]">
                  Aethera · Inizia ora
                </p>
                <h2
                  className="mx-auto mt-7 max-w-4xl text-4xl font-medium leading-[1.02] tracking-tight sm:text-5xl md:text-7xl"
                  style={{ letterSpacing: "-.06em" }}
                >
                  Porta il tuo centro <span className="font-playfair font-normal italic">oltre</span>
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60">
                  Richiedi il check-up gratuito del tuo centro o entra nella community 4E.
                </p>

                <form
                  onSubmit={handleLeadSubmit}
                  className="mx-auto mt-10 flex max-w-xl flex-col gap-3"
                  aria-label="Richiedi il check-up gratuito"
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      className="lead-input"
                      placeholder="Il tuo nome"
                      aria-label="Il tuo nome"
                      autoComplete="name"
                      value={leadData.name}
                      onChange={(e) => setLeadData((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={isSubmittingLead}
                    />
                    <input
                      type="email"
                      className="lead-input"
                      placeholder="La tua email"
                      aria-label="La tua email"
                      autoComplete="email"
                      value={leadData.email}
                      onChange={(e) => setLeadData((prev) => ({ ...prev, email: e.target.value }))}
                      disabled={isSubmittingLead}
                    />
                  </div>
                  <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isSubmittingLead}
                      className="w-fit rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-all hover:scale-[1.03] hover:bg-[#effbff] hover:shadow-lg hover:shadow-[#bfeeff]/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmittingLead ? "Invio in corso..." : "Richiedi il check-up"}
                    </button>
                    <a
                      href="#newsletter"
                      onClick={(e) => scrollToAnchor(e, "newsletter")}
                      className="w-fit rounded-full border border-white/30 bg-transparent px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:border-white/55 hover:bg-white/10 active:scale-95"
                    >
                      Iscriviti alla newsletter
                    </a>
                  </div>
                  <p className="mt-3 text-xs text-white/45">
                    ✓ Gratuito e senza impegno · Riceverai subito il link di accesso via email
                  </p>
                </form>
              </div>
            </section>

            <div className="section-line mx-auto h-px max-w-6xl"></div>

            {/* ---------- FAQ ---------- */}
            <section id="faq" className="relative mx-auto max-w-3xl px-5 py-24 sm:px-8 md:py-32">
              <p className="eyebrow reveal">
                <span className="eyebrow-line"></span> Domande
              </p>
              <h2
                className="reveal mt-7 text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl"
                style={{ letterSpacing: "-.055em" }}
              >
                Domande <span className="font-playfair font-normal italic">frequenti</span>
              </h2>
              <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
                {FAQ_ITEMS.map((item, index) => (
                  <div key={item.question} className={`faq-item ${openFaq === index ? "open" : ""}`}>
                    <button
                      className="faq-toggle flex w-full items-center justify-between gap-6 py-7 text-left"
                      type="button"
                      aria-expanded={openFaq === index}
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    >
                      <span className="text-lg font-medium tracking-tight">{item.question}</span>
                      <Plus className="faq-icon h-6 w-6 shrink-0 text-[#bfeeff]" aria-hidden="true" />
                    </button>
                    <div className="faq-body">
                      <p className="pb-7 pr-10 text-sm leading-relaxed text-white/60">{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------- FOOTER ---------- */}
            <footer className="border-t border-white/10">
              <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-20">
                <div className="mb-14 overflow-hidden">
                  <p className="font-playfair text-[18vw] italic leading-none tracking-[-.08em] text-white/90 md:text-[10rem]">
                    Aethera
                  </p>
                </div>
                <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-sm">
                    <p className="text-sm leading-relaxed text-white/55">
                      Aethera — La piattaforma 4 Elementi Italia per estetiste, centri
                      estetici e spa: formazione, gestionale, AI e community in un unico
                      luogo.
                    </p>
                    {(landingNewsletter?.title || landingNewsletter?.body) && (
                      <div className="mt-8">
                        {landingNewsletter?.title && (
                          <p className="text-sm font-semibold text-white/90">
                            {landingNewsletter.title}
                          </p>
                        )}
                        {landingNewsletter?.body && (
                          <p className="mt-1 text-xs leading-relaxed text-white/55">
                            {landingNewsletter.body}
                          </p>
                        )}
                      </div>
                    )}
                    <form
                      id="newsletter"
                      onSubmit={handleNewsletterSubmit}
                      className="mt-4 flex flex-col gap-3 sm:flex-row"
                      aria-label="Iscriviti alla newsletter"
                    >
                      <input
                        type="email"
                        className="lead-input"
                        placeholder="la.tua.email@esempio.com"
                        aria-label="Email per la newsletter"
                        autoComplete="email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        required
                        disabled={isSubmittingNewsletter}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingNewsletter}
                        className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:scale-[1.03] hover:bg-[#effbff] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmittingNewsletter
                          ? "Invio..."
                          : landingNewsletter?.cta_label ?? "Iscriviti"}
                      </button>
                    </form>
                    <p className="mt-3 text-xs text-white/40">
                      {newsletterExtra.privacy_note ??
                        "Rispettiamo la tua privacy. Nessuno spam, solo contenuti di valore."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.26em] text-white/40">
                        Piattaforma
                      </p>
                      <ul className="mt-5 space-y-3 text-sm text-white/60">
                        <li>
                          <a href="#metodo" onClick={(e) => scrollToAnchor(e, "metodo")} className="hover:text-white">
                            Metodo
                          </a>
                        </li>
                        <li>
                          <a href="#percorsi" onClick={(e) => scrollToAnchor(e, "percorsi")} className="hover:text-white">
                            Percorsi
                          </a>
                        </li>
                        <li>
                          <a href="#faq" onClick={(e) => scrollToAnchor(e, "faq")} className="hover:text-white">
                            FAQ
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.26em] text-white/40">
                        Azienda
                      </p>
                      <ul className="mt-5 space-y-3 text-sm text-white/60">
                        <li>
                          <a href="#metodo" onClick={(e) => scrollToAnchor(e, "metodo")} className="hover:text-white">
                            Chi siamo
                          </a>
                        </li>
                        <li>
                          <a href="#cta" onClick={(e) => scrollToAnchor(e, "cta")} className="hover:text-white">
                            Contatti
                          </a>
                        </li>
                        {landingFooterExtra.recovery_text && (
                          <li className="text-xs text-white/45">
                            {landingFooterExtra.recovery_text}
                          </li>
                        )}
                        <li>
                          <button
                            type="button"
                            onClick={() => navigate("/recupera-accesso")}
                            className="hover:text-white"
                          >
                            {landingFooterExtra.recovery_cta ?? "Recupera accesso"}
                          </button>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.26em] text-white/40">
                        Social
                      </p>
                      <ul className="mt-5 space-y-3 text-sm text-white/60">
                        <li>
                          <a
                            href="https://www.instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white"
                          >
                            Instagram
                          </a>
                        </li>
                        <li>
                          <a
                            href="https://www.linkedin.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white"
                          >
                            LinkedIn
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p>
                      {landingFooter?.body ??
                        "© 2026 4 Elementi Italia. Equilibrio, metodo, impresa."}
                    </p>
                    {landingLegalLinks.map((link) => (
                      <a
                        key={`${link.location}-${link.link_key}`}
                        href={link.url}
                        className="iubenda-white iubenda-noiframe iubenda-embed hover:text-white hover:underline"
                        title={link.label}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                  <p className="uppercase tracking-[.24em]">Corpo · Mente · Natura</p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};
export default LandingPage;
