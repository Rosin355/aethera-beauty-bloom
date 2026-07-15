/**
 * Centralized landing imagery.
 *
 * Each entry documents the subject its slot MUST show, so any photo can be swapped
 * line-by-line without touching components or CSS (real client photos — or a bespoke
 * "4 Elementi" shoot — will eventually replace these).
 *
 * Rules for every image:
 *  - Unsplash, full color, warm & luminous, consistent crop params.
 *  - NO branded / packaged products, no visible logos or trademarks.
 *  - NO clinical / medical imagery (scalpels, surgical caps/gloves).
 *  - Beauty / wellness / business subjects, coherent with the section it sits in.
 *  - Every slot uses a UNIQUE image (no duplicates across the page).
 */

const unsplash = (id: string, w = 1400, q = 90) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;

export const LANDING_IMAGES = {
  // ---- Hero ----
  /** Hero BASE layer — elegant beauty-center interior / treatment cabin, soft warm light. */
  heroBase: unsplash("photo-1600334129128-685c5582fd35", 2400),

  // ---- Ambient backgrounds (heavily blurred; keep botanical / natural) ----
  /** Story section ambient bg — botanical / natural, warm. */
  storyAmbient: unsplash("photo-1540555700478-4be289fbecef", 2200),
  /** Story section reveal bg (screen-blended) — botanical / floral. */
  storyReveal: unsplash("photo-1570172619644-dfd03ed5d881", 2200),
  /** Scroll-cinema ambient bg (blurred) — warm, natural. */
  cinemaAmbient: unsplash("photo-1522337660859-02fbefca4702", 1800),

  // ---- Story cards (5 chapters) ----
  /** 01 Formazione — training moment: workshop / notebook / professional learning. */
  storyFormazione: unsplash("photo-1503676260728-1c00da094a0b"),
  /** 02 Gestionale — reception / front desk / agenda workspace of a salon. */
  storyGestionale: unsplash("photo-1497366811353-6870744d04b2"),
  /** 03 Assistente AI — hands with tablet/laptop in warm ambient light (no robots / sci-fi). */
  storyAI: unsplash("photo-1531297484001-80022131f5a1"),
  /** 04 Community — group of professional women talking / collaborating. */
  storyCommunity: unsplash("photo-1517048676732-d65bc937f952"),
  /** 05 Numeri — business analytics: desk with charts, calculator, planning. */
  storyNumeri: unsplash("photo-1554224155-6726b3ff858f"),

  // ---- Percorsi cards (3) ----
  /** No.01 Sette Passi — a path/steps metaphor: trail / stairway in warm natural light. */
  percorsoSettePassi: unsplash("photo-1470071459604-3b5ec3a7fe05"),
  /** No.02 Gestione & Numeri — ledger / planner / spreadsheets on a desk. */
  percorsoGestione: unsplash("photo-1450101499163-c8848c66ca85"),
  /** No.03 AI & Marketing — creative / content workspace: laptop + notes (no massage!). */
  percorsoMarketing: unsplash("photo-1499750310107-5fef28a66643"),

  // ---- Scroll-cinema frames (3) ----
  /** "Check-up del centro" — consultation: professional with tablet/clipboard + client (no instruments). */
  cinemaCheckup: unsplash("photo-1600880292203-757bb62b4baf"),
  /** "Metodo 4E" — planning/method: moodboard / planner, hands organizing a strategy on paper. */
  cinemaMetodo: unsplash("photo-1517245386807-bb43f82c33c4"),
  /** "Crescita misurabile" — growth/data: laptop / desk with rising charts / KPI. */
  cinemaCrescita: unsplash("photo-1551288049-bebda4e38f71"),

  // ---- Diario 4E (featured note) ----
  /** "Listino" — price list / desk with documents and notes. */
  diarioListino: unsplash("photo-1517842645767-c639042777db"),

  // ---- Il Metodo (vision) ----
  /** "Equilibrio tra corpo, mente e natura" — serene, symbolic nature/light (NOT a tropical resort). */
  metodoEquilibrio: unsplash("photo-1518495973542-4542c06a5843", 1800),
} as const;
