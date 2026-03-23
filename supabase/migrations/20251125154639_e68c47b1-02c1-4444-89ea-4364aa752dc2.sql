-- Aggiungi policy per admin per vedere tutte le risposte forum
CREATE POLICY "Admins can view all replies"
ON public.forum_replies
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Aggiungi policy per admin per aggiornare tutte le risposte forum (approvazione/rifiuto)
CREATE POLICY "Admins can update all replies"
ON public.forum_replies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));