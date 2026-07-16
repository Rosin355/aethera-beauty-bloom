-- Realistic demo data for the management module, tenant-aware.
-- Everything hangs off a single demo center ("Centro Estetico Aurora") owned by a
-- demo user, so RLS keeps it isolated: the demo owner sees it, other centers/users
-- do not, platform admins still do. Idempotent: re-running clears and re-seeds ONLY
-- this center's rows (scoped by center_id), never other tenants' data.
--
-- Demo login: demo.aurora@4elementiitalia.it  /  DemoAurora2026!
--
-- Column mapping notes (adapted to the real schema, no invented columns):
--   inventory_items has no min_threshold/unit_cost -> unit_cost_eur maps to price,
--     and a realistic supplier is supplied (supplier is NOT NULL). Low-stock is shown
--     by seeding "Smalto semipermanente" at quantity 3.
--   client_metrics is one wide row per (client_user_id, metric_date); the monthly KPIs
--     map onto its columns. The owner's live overview is computed from the seeded
--     appointments/inventory, so those numbers populate on their own too.
--   client_notes.client_user_id must be a real user; salon clients aren't users, so the
--     notes are recorded under the demo owner with the client name inside the text.

DO $$
DECLARE
  v_user_id  uuid := '0a0a0a0a-0000-4000-8000-000000000001';
  v_email    text := 'demo.aurora@4elementiitalia.it';
  v_center_id uuid;
BEGIN
  -- 1) Demo auth user (+ identity, profile, role) --------------------------------
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt('DemoAurora2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Aurora Demo"}'::jsonb
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id, v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (v_user_id, 'Aurora Demo', v_email)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2) Demo center + owner membership (idempotent by owner+name) ------------------
  SELECT id INTO v_center_id
  FROM public.centers
  WHERE owner_user_id = v_user_id AND name = 'Centro Estetico Aurora'
  LIMIT 1;

  IF v_center_id IS NULL THEN
    INSERT INTO public.centers (name, owner_user_id, plan)
    VALUES ('Centro Estetico Aurora', v_user_id, 'free')
    RETURNING id INTO v_center_id;
  END IF;

  INSERT INTO public.center_members (center_id, user_id, role, status)
  VALUES (v_center_id, v_user_id, 'owner', 'active')
  ON CONFLICT (center_id, user_id) DO NOTHING;

  -- 3) Clear this center's demo rows so re-seeding never duplicates ---------------
  DELETE FROM public.business_appointments WHERE center_id = v_center_id;
  DELETE FROM public.business_services     WHERE center_id = v_center_id;
  DELETE FROM public.inventory_items       WHERE center_id = v_center_id;
  DELETE FROM public.client_metrics        WHERE center_id = v_center_id;
  DELETE FROM public.client_notes          WHERE center_id = v_center_id;

  -- 4) Services ------------------------------------------------------------------
  INSERT INTO public.business_services (center_id, user_id, name, category, duration_minutes, price, description, is_active)
  VALUES
    (v_center_id, v_user_id, 'Pulizia viso profonda',            'Viso',         60,  55, 'Detersione profonda, esfoliazione ed estrazione.', true),
    (v_center_id, v_user_id, 'Trattamento anti-age T-Model',      'Viso',         75,  90, 'Protocollo anti-età con acido ialuronico.',        true),
    (v_center_id, v_user_id, 'Radiofrequenza viso',               'Viso',         45,  70, 'Stimolazione del collagene con radiofrequenza.',   true),
    (v_center_id, v_user_id, 'Massaggio corpo drenante',          'Corpo',        50,  65, 'Massaggio linfodrenante gambe e addome.',          true),
    (v_center_id, v_user_id, 'Trattamento anticellulite',         'Corpo',        60,  75, 'Fango e massaggio anticellulite.',                 true),
    (v_center_id, v_user_id, 'Ceretta gambe complete',            'Epilazione',   30,  25, 'Epilazione a caldo gambe complete.',               true),
    (v_center_id, v_user_id, 'Ceretta inguine',                   'Epilazione',   15,  15, 'Epilazione a caldo zona inguine.',                 true),
    (v_center_id, v_user_id, 'Manicure semipermanente',           'Mani & Piedi', 45,  30, 'Manicure con smalto semipermanente.',              true),
    (v_center_id, v_user_id, 'Pedicure estetica',                 'Mani & Piedi', 50,  35, 'Pedicure estetica curativa.',                      true),
    (v_center_id, v_user_id, 'Laminazione ciglia',                'Sguardo',      60,  50, 'Laminazione e nutrimento delle ciglia.',           true),
    (v_center_id, v_user_id, 'Trucco sposa (prova + evento)',     'Make-up',      90, 120, 'Prova trucco e make-up del giorno dell''evento.',  true);

  -- 5) Inventory (unit_cost_eur -> price; low stock on the nail polish) -----------
  INSERT INTO public.inventory_items (center_id, user_id, name, category, quantity, supplier, price, is_archived)
  VALUES
    (v_center_id, v_user_id, 'Crema anti-age 50ml',                'Viso',         12, 'Beauty Point Srl',            18, false),
    (v_center_id, v_user_id, 'Siero vitamina C 30ml',              'Viso',          8, 'DermaSupply',                 14, false),
    (v_center_id, v_user_id, 'Cera depilatoria (barattolo)',       'Epilazione',   20, 'WaxItalia',                    6, false),
    (v_center_id, v_user_id, 'Strisce depilatorie (conf.)',        'Epilazione',   15, 'WaxItalia',                    4, false),
    (v_center_id, v_user_id, 'Smalto semipermanente (set colori)', 'Mani & Piedi',  3, 'Nova Cosmetics',              45, false),
    (v_center_id, v_user_id, 'Olio da massaggio 500ml',            'Corpo',         6, 'Estetica Pro Distribuzione',  12, false),
    (v_center_id, v_user_id, 'Fango anticellulite 1kg',            'Corpo',         4, 'Estetica Pro Distribuzione',  22, false),
    (v_center_id, v_user_id, 'Guanti monouso (conf. 100)',         'Consumabili',   9, 'MedForniture',                 5, false),
    (v_center_id, v_user_id, 'Salviette monouso (conf.)',          'Consumabili',  25, 'MedForniture',                 3, false);

  -- 6) Appointments — upcoming (7) + past completed (6). Join to the center's own
  --    services so the appointment<->service tenant-integrity trigger passes and
  --    service_id/duration/price stay consistent.
  INSERT INTO public.business_appointments
    (center_id, user_id, client_name, service_id, service_name, appointment_at, duration_minutes, price, status)
  SELECT v_center_id, v_user_id, a.client_name, s.id, s.name, a.appt_at, s.duration_minutes, s.price, a.status
  FROM (VALUES
    -- upcoming
    ('Giulia Ferrari',    'Pulizia viso profonda',        date_trunc('day', now()) + interval '1 day'  + interval '10 hours',            'confermato'),
    ('Martina Conti',     'Manicure semipermanente',      date_trunc('day', now()) + interval '1 day'  + interval '11 hours 30 minutes', 'confermato'),
    ('Sara Greco',        'Massaggio corpo drenante',     date_trunc('day', now()) + interval '1 day'  + interval '15 hours',            'in_attesa'),
    ('Elisa Marino',      'Trattamento anti-age T-Model', date_trunc('day', now()) + interval '2 days' + interval '9 hours 30 minutes',  'confermato'),
    ('Chiara Rizzo',      'Ceretta gambe complete',       date_trunc('day', now()) + interval '2 days' + interval '16 hours',            'confermato'),
    ('Valentina Bruno',   'Laminazione ciglia',           date_trunc('day', now()) + interval '3 days' + interval '14 hours',            'in_attesa'),
    ('Federica Costa',    'Pedicure estetica',            date_trunc('day', now()) + interval '4 days' + interval '17 hours 30 minutes', 'confermato'),
    -- past completed
    ('Aurora Ricci',      'Radiofrequenza viso',          date_trunc('day', now()) - interval '1 day'  + interval '10 hours',            'completato'),
    ('Beatrice Villa',    'Trattamento anticellulite',    date_trunc('day', now()) - interval '2 days' + interval '15 hours',            'completato'),
    ('Camilla Fontana',   'Ceretta inguine',              date_trunc('day', now()) - interval '3 days' + interval '11 hours',            'completato'),
    ('Debora Sala',       'Manicure semipermanente',      date_trunc('day', now()) - interval '4 days' + interval '16 hours 30 minutes', 'completato'),
    ('Eleonora Longo',    'Pulizia viso profonda',        date_trunc('day', now()) - interval '5 days' + interval '9 hours 30 minutes',  'completato'),
    ('Francesca Moretti', 'Trucco sposa (prova + evento)',date_trunc('day', now()) - interval '6 days' + interval '14 hours',            'completato')
  ) AS a(client_name, service_name, appt_at, status)
  JOIN public.business_services s
    ON s.center_id = v_center_id AND s.name = a.service_name;

  -- 7) Monthly KPI snapshot (client_metrics) -------------------------------------
  INSERT INTO public.client_metrics (
    center_id, client_user_id, metric_date, revenue, active_clients, services_count,
    bookings_count, conversion_rate, retention_returning, retention_new,
    business_health_score, sessions_count, top_services, service_distribution, training_progress
  ) VALUES (
    v_center_id, v_user_id, date_trunc('month', now())::date,
    8450, 132, 11, 176, 61, 80, 52, 78, 176,
    '[{"name":"Trattamento anti-age T-Model","count":24,"revenue":2160},{"name":"Pulizia viso profonda","count":31,"revenue":1705},{"name":"Manicure semipermanente","count":28,"revenue":840}]'::jsonb,
    '[{"name":"Viso","value":45},{"name":"Corpo","value":22},{"name":"Mani & Piedi","value":18},{"name":"Epilazione","value":10},{"name":"Sguardo","value":5}]'::jsonb,
    '[]'::jsonb
  );

  -- 8) Client notes (recorded under the demo owner; client named in the text) -----
  INSERT INTO public.client_notes (center_id, client_user_id, note_text, note_date, category, created_by, created_by_name)
  VALUES
    (v_center_id, v_user_id,
     'Giulia Ferrari: pelle sensibile, evitare acidi forti. Preferisce appuntamenti al mattino.',
     CURRENT_DATE, 'generale', v_user_id, 'Aurora Demo'),
    (v_center_id, v_user_id,
     'Elisa Marino: interessata a pacchetto anti-age 5 sedute.',
     CURRENT_DATE, 'generale', v_user_id, 'Aurora Demo');
END $$;
