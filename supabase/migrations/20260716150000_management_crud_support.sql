-- Support for full management CRUD: inventory soft-archive timestamp, appointment
-- status vocabulary (Italian) + optional notes.

-- Inventory: soft archive via archived_at (archived rows are filtered from default lists).
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS archived_at timestamptz;
UPDATE public.inventory_items
  SET archived_at = updated_at
  WHERE is_archived = true AND archived_at IS NULL;

-- Appointments: free-text notes for the edit dialog.
ALTER TABLE public.business_appointments ADD COLUMN IF NOT EXISTS notes text;

-- Appointments: normalize legacy statuses, set the Italian default, enforce the vocabulary.
UPDATE public.business_appointments
  SET status = 'in_attesa'
  WHERE status IS NULL OR status NOT IN ('confermato', 'in_attesa', 'completato', 'annullato');

ALTER TABLE public.business_appointments ALTER COLUMN status SET DEFAULT 'in_attesa';
ALTER TABLE public.business_appointments DROP CONSTRAINT IF EXISTS business_appointments_status_check;
ALTER TABLE public.business_appointments ADD CONSTRAINT business_appointments_status_check
  CHECK (status IN ('confermato', 'in_attesa', 'completato', 'annullato'));
