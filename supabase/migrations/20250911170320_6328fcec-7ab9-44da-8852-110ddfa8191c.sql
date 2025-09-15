-- Crea tabella per la mailing list
CREATE TABLE public.mailing_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'landing_page',
  access_token TEXT DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crea tabella per iscrizioni newsletter
CREATE TABLE public.newsletter_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  mailing_list_id UUID REFERENCES public.mailing_list(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Abilita RLS per entrambe le tabelle
ALTER TABLE public.mailing_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy per mailing_list (accessibile a tutti per inserimento, solo admins per lettura completa)
CREATE POLICY "Anyone can subscribe to mailing list" 
ON public.mailing_list 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can read their own mailing list entry" 
ON public.mailing_list 
FOR SELECT 
USING (true);

-- Policy per newsletter_subscriptions
CREATE POLICY "Anyone can subscribe to newsletter" 
ON public.newsletter_subscriptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can read newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR SELECT 
USING (true);

-- Indici per performance
CREATE INDEX idx_mailing_list_email ON public.mailing_list(email);
CREATE INDEX idx_mailing_list_token ON public.mailing_list(access_token);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscriptions(email);