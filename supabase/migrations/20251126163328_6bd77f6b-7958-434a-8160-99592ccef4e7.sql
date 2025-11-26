-- Rimuovi le policy esistenti e ricreale con maggiore sicurezza
DROP POLICY IF EXISTS "Anyone can subscribe to mailing list" ON public.mailing_list;
DROP POLICY IF EXISTS "Admins can read all mailing list entries" ON public.mailing_list;

-- Policy per INSERT: solo utenti anonimi o autenticati possono iscriversi
CREATE POLICY "Allow public mailing list signup"
ON public.mailing_list
FOR INSERT
TO public
WITH CHECK (true);

-- Policy per SELECT: SOLO admin possono leggere
CREATE POLICY "Only admins can read mailing list"
ON public.mailing_list
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy esplicita per negare UPDATE a tutti tranne admin
CREATE POLICY "Only admins can update mailing list"
ON public.mailing_list
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy esplicita per negare DELETE a tutti tranne admin
CREATE POLICY "Only admins can delete from mailing list"
ON public.mailing_list
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Aggiungi un commento sulla sicurezza della tabella
COMMENT ON TABLE public.mailing_list IS 'Contains sensitive subscriber data (emails, names, access tokens). Access restricted to admins only via RLS policies. The validate_access_token() function provides controlled access for token validation without exposing bulk data.';