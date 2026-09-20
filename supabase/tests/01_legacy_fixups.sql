-- Harness-only: reconcile the legacy (Lovable-generated) migrations, which cannot be replayed
-- from an empty database, with the shape the LIVE database has. Not a migration.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;
