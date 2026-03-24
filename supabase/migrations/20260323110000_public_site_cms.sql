-- CMS minimo per contenuti pubblici (marketing/editoriale)

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  value_text TEXT,
  value_json JSONB,
  is_public BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_value_check CHECK (value_text IS NOT NULL OR value_json IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  body TEXT,
  cta_label TEXT,
  cta_link TEXT,
  badge_label TEXT,
  badge_link TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  quote TEXT NOT NULL,
  image_url TEXT,
  gradient_class TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_key TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  location TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (link_key, location)
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_sections_key ON public.site_sections(section_key);
CREATE INDEX IF NOT EXISTS idx_site_sections_active_order ON public.site_sections(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_active_order ON public.testimonials(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_legal_links_location_order ON public.legal_links(location, is_active, sort_order);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read public site settings" ON public.site_settings;
CREATE POLICY "Public can read public site settings"
ON public.site_settings
FOR SELECT
USING (is_public = true);

DROP POLICY IF EXISTS "Public can read active site sections" ON public.site_sections;
CREATE POLICY "Public can read active site sections"
ON public.site_sections
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active testimonials" ON public.testimonials;
CREATE POLICY "Public can read active testimonials"
ON public.testimonials
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active legal links" ON public.legal_links;
CREATE POLICY "Public can read active legal links"
ON public.legal_links
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage site sections" ON public.site_sections;
CREATE POLICY "Admins can manage site sections"
ON public.site_sections
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage legal links" ON public.legal_links;
CREATE POLICY "Admins can manage legal links"
ON public.legal_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT SELECT ON public.site_sections TO anon, authenticated;
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT SELECT ON public.legal_links TO anon, authenticated;

INSERT INTO public.site_settings (setting_key, value_text, sort_order)
VALUES
  ('brand_name', '4 elementi Italia', 1),
  ('support_email', 'support@4elementitalia.com', 2),
  ('company_address_line_1', 'Via Example 123, 00100', 3),
  ('company_address_line_2', 'Roma, Italia', 4)
ON CONFLICT (setting_key) DO UPDATE
SET value_text = EXCLUDED.value_text,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

INSERT INTO public.site_sections (
  section_key, title, subtitle, body, cta_label, cta_link, badge_label, badge_link, extra, sort_order
)
VALUES
  (
    'home_hero',
    'La Piattaforma Completa per',
    'Professioniste della Bellezza',
    'Strumenti di gestione, formazione continua, supporto personalizzato e una comunità professionale per far crescere il tuo business nel mondo beauty.',
    'Inizia Ora',
    '/signup',
    'Nuovi corsi di formazione disponibili',
    '/dashboard/training',
    '{
      "secondary_cta_label": "Esplora le Funzionalità",
      "secondary_cta_link": "/home",
      "badge_cta_label": "Scopri di più",
      "image_url": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80",
      "image_alt": "Professionista della bellezza al lavoro"
    }'::jsonb,
    10
  ),
  (
    'home_features',
    'Perché Unirsi a 4 elementi Italia?',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{
      "features": [
        { "title": "Formazione Continua", "description": "Accedi a corsi video, materiali scaricabili e ottieni certificati automatici per migliorare le tue competenze professionali.", "icon": "book-open", "color": "bg-brand-water" },
        { "title": "Strumenti di Gestione", "description": "Organizza la tua attività con calendari digitali, gestione dell''inventario e dashboard analitici completi.", "icon": "calendar", "color": "bg-brand-fire" },
        { "title": "Comunità Professionale", "description": "Connettiti con altre estetiste attraverso forum, condividi testimonianze e partecipa a eventi dal vivo.", "icon": "users", "color": "bg-brand-air" },
        { "title": "Supporto AI", "description": "Ricevi consigli personalizzati su business e gestione dei trattamenti attraverso il nostro Assistente AI intelligente.", "icon": "message-square", "color": "bg-brand-earth" },
        { "title": "Dashboard Analitico", "description": "Monitora KPI, vendite, margini e performance mensili con visualizzazioni belle e facili da comprendere.", "icon": "chart-pie", "color": "bg-brand-black" }
      ],
      "hover_features": [
        { "title": "Formazione Continua", "description": "Accedi a corsi video, materiali scaricabili e ottieni certificati automatici per migliorare le tue competenze professionali.", "icon": "book-open" },
        { "title": "Strumenti di Gestione", "description": "Organizza la tua attività con calendari digitali, gestione dell''inventario e dashboard analitici completi.", "icon": "settings" },
        { "title": "Comunità Professionale", "description": "Connettiti con altre estetiste attraverso forum, condividi testimonianze e partecipa a eventi dal vivo.", "icon": "users" },
        { "title": "Supporto AI", "description": "Ricevi consigli personalizzati su business e gestione dei trattamenti attraverso il nostro Assistente AI intelligente.", "icon": "message-square" },
        { "title": "Dashboard Analitico", "description": "Monitora KPI, vendite, margini e performance mensili con visualizzazioni belle e facili da comprendere.", "icon": "bar-chart-3" },
        { "title": "Supporto 24/7", "description": "Accedi a supporto professionale in qualsiasi momento attraverso vari canali di comunicazione.", "icon": "help-circle" },
        { "title": "Risultati Garantiti", "description": "Vedi risultati concreti nella crescita del tuo business grazie ai nostri strumenti e metodi testati.", "icon": "calendar" },
        { "title": "Esperienza Olistica", "description": "Un approccio completo che integra competenze tecniche, gestione aziendale e benessere professionale.", "icon": "heart" }
      ]
    }'::jsonb,
    20
  ),
  (
    'home_call_to_action',
    'Pronta a',
    'Trasformare',
    'Unisciti a migliaia di professioniste della bellezza che stanno elevando le loro competenze con 4 elementi Italia.',
    'Registrati Gratuitamente',
    '/signup',
    NULL,
    NULL,
    '{
      "title_suffix": "il Tuo Business Beauty?",
      "card_title": "Inizia Oggi",
      "card_body": "Crea il tuo account ora e inizia ad esplorare tutte le funzionalità che 4 elementi Italia ha da offrire.",
      "benefits": [
        "Prova gratuita di 14 giorni",
        "Nessuna carta di credito richiesta",
        "Cancella in qualsiasi momento"
      ]
    }'::jsonb,
    30
  ),
  (
    'home_footer',
    NULL,
    NULL,
    'Potenziamo i professionisti della bellezza con strumenti e risorse per la crescita e il successo professionale.',
    NULL,
    NULL,
    NULL,
    NULL,
    '{
      "features_heading": "Funzionalità",
      "company_heading": "Azienda",
      "contacts_heading": "Contatti",
      "copyright_text": "© {year} 4 elementi Italia. Tutti i diritti riservati.",
      "feature_links": [
        { "label": "Formazione Online", "path": "/dashboard/training", "type": "internal" },
        { "label": "Strumenti di Gestione", "path": "/dashboard/management", "type": "internal" },
        { "label": "Comunità Professionale", "path": "/dashboard/community", "type": "internal" },
        { "label": "Supporto Personalizzato", "path": "mailto:support@4elementitalia.com", "type": "external" }
      ],
      "company_links": [
        { "label": "Chi Siamo", "disabled": true, "title": "Prossimamente disponibile" },
        { "label": "Blog", "disabled": true, "title": "Prossimamente disponibile" },
        { "label": "Carriere", "disabled": true, "title": "Prossimamente disponibile" }
      ]
    }'::jsonb,
    40
  ),
  (
    'cookie_banner',
    'Utilizziamo i cookie',
    NULL,
    'Utilizziamo cookie per migliorare la tua esperienza di navigazione e per fornire servizi personalizzati. Continuando a navigare accetti il loro utilizzo.',
    'Accetta tutti',
    NULL,
    NULL,
    NULL,
    '{
      "reject_label": "Solo necessari"
    }'::jsonb,
    50
  ),
  (
    'landing_header',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{
      "nav_links": [
        { "label": "VIDEO GRATUITO", "href": "#video" },
        { "label": "CHI SIAMO", "href": "#about" },
        { "label": "SERVIZI", "href": "#services" },
        { "label": "CONTATTI", "href": "#contact" }
      ]
    }'::jsonb,
    60
  ),
  (
    'landing_hero',
    'SEI UN''ESTETISTA',
    'PROFESSIONISTA?',
    'Ecco come strutturare il tuo listino in modo strategico (senza stress)',
    'SCARICA IL MINI CORSO GRATUITO',
    '#video-form',
    NULL,
    NULL,
    '{
      "paragraphs": [
        "Ciao! Se sei un''estetista professionista e ti stai chiedendo come strutturare un listino prezzi che sia chiaro, professionale e che valorizzi davvero i tuoi servizi... sei nel posto giusto.",
        "Mi chiamo Davide e con 4 Elementi Italia aiutiamo estetiste e professionisti del benessere a diventare imprenditori consapevoli, strategici e autonomi – senza stress, senza perdere tempo in corsi complicati o contenuti poco chiari."
      ],
      "cta_note": "✓ Nessun pagamento richiesto • Download immediato • Guarda quando vuoi",
      "form_title": "SCARICA IL VIDEO GRATUITO",
      "form_subtitle": "Compila il form e ricevi subito il link per scaricare il video completo",
      "submit_loading_label": "INVIO IN CORSO...",
      "submit_label": "SCARICA IL MINI CORSO GRATUITO",
      "success_note": "Riceverai immediatamente un''email con il link per scaricare il video completo. Controlla anche la cartella spam!",
      "form_disclaimer": "✓ Nessun pagamento richiesto • Download immediato • Guarda quando vuoi"
    }'::jsonb,
    70
  ),
  (
    'landing_final_cta',
    'TRASFORMA IL TUO CENTRO ESTETICO IN UNA',
    'VERA IMPRESA',
    'Se vuoi trasformare il tuo centro estetico in una vera impresa, sei nel posto giusto. ✨',
    'SCARICA IL VIDEO GRATUITO',
    '#video-form',
    NULL,
    NULL,
    '{
      "closing_title": "Ti aspetto dall''altra parte!",
      "closing_subtitle": "Davide – Fondatore di 4 Elementi Italia",
      "cta_note": "✓ Nessun pagamento richiesto • Download immediato • Guarda quando vuoi"
    }'::jsonb,
    80
  ),
  (
    'landing_newsletter',
    'Sta per arrivare qualcosa di grande.',
    NULL,
    'Iscriviti ora per non perderti il lancio ufficiale della piattaforma e accedere in anteprima alla community riservata ai professionisti del settore.',
    'ISCRIVITI ALLA NEWSLETTER',
    NULL,
    NULL,
    NULL,
    '{
      "benefits": [
        "Tips settimanali esclusivi per far crescere il tuo business",
        "Strategie pratiche e strumenti pronti all''uso",
        "Accesso anticipato a corsi, risorse e novità"
      ],
      "form_title": "👉 Iscriviti oggi. Sii tra i primi a entrare.",
      "name_label": "Nome *",
      "name_placeholder": "Il tuo nome",
      "email_label": "Email *",
      "email_placeholder": "la.tua.email@esempio.com",
      "loading_label": "Iscrizione in corso...",
      "privacy_note": "Rispettiamo la tua privacy. Nessuno spam, solo contenuti di valore."
    }'::jsonb,
    90
  ),
  (
    'landing_footer',
    NULL,
    NULL,
    '© 2024 4 Elementi Italia. Tutti i diritti riservati.',
    NULL,
    NULL,
    NULL,
    NULL,
    '{
      "recovery_text": "Hai perso l''email di accesso?",
      "recovery_cta": "Recupera qui"
    }'::jsonb,
    100
  )
ON CONFLICT (section_key) DO UPDATE
SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  body = EXCLUDED.body,
  cta_label = EXCLUDED.cta_label,
  cta_link = EXCLUDED.cta_link,
  badge_label = EXCLUDED.badge_label,
  badge_link = EXCLUDED.badge_link,
  extra = EXCLUDED.extra,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.testimonials (name, role, quote, image_url, gradient_class, sort_order)
VALUES
  (
    'Sofia Loren',
    'Titolare di Centro Estetico',
    '4 elementi Italia ha completamente trasformato il modo in cui gestisco il mio centro estetico. Gli strumenti di gestione mi fanno risparmiare ore ogni settimana.',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    'from-purple-500 to-pink-500',
    10
  ),
  (
    'Marco Rossi',
    'Specialista Skincare',
    'L''assistente AI offre consigli personalizzati che mi hanno aiutato a ottimizzare le operazioni del mio business. Le risorse di formazione sono di prima qualità.',
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    'from-blue-500 to-purple-500',
    20
  ),
  (
    'Elena Chen',
    'Estetista Freelance',
    'Ho aumentato la mia clientela del 40% da quando uso gli strumenti analitici di 4 elementi Italia. Le intuizioni mi hanno aiutato a personalizzare i miei servizi.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    'from-pink-500 to-red-500',
    30
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.legal_links (link_key, label, url, location, sort_order)
VALUES
  ('privacy', 'Privacy Policy', 'https://www.iubenda.com/privacy-policy/19385152', 'home_footer', 10),
  ('terms', 'Termini', 'https://www.iubenda.com/termini-e-condizioni/19385152', 'home_footer', 20),
  ('cookie', 'Cookie Policy', 'https://www.iubenda.com/privacy-policy/19385152/cookie-policy', 'home_footer', 30),
  ('privacy', 'Privacy Policy', 'https://www.iubenda.com/privacy-policy/19385152', 'cookie_banner', 10),
  ('cookie', 'Cookie Policy', 'https://www.iubenda.com/privacy-policy/19385152/cookie-policy', 'cookie_banner', 20),
  ('privacy', 'Privacy Policy', 'https://www.iubenda.com/privacy-policy/19385152', 'landing_footer', 10),
  ('cookie', 'Cookie Policy', 'https://www.iubenda.com/privacy-policy/19385152/cookie-policy', 'landing_footer', 20)
ON CONFLICT (link_key, location) DO UPDATE
SET
  label = EXCLUDED.label,
  url = EXCLUDED.url,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
