-- Tabella per memoria conversazionale AI
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indice per velocizzare le query per utente
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated_at ON public.ai_conversations(updated_at DESC);

-- Abilita RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: utenti vedono solo le proprie conversazioni
CREATE POLICY "Users can view their own conversations" 
ON public.ai_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: utenti possono creare le proprie conversazioni
CREATE POLICY "Users can create their own conversations" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: utenti possono aggiornare le proprie conversazioni
CREATE POLICY "Users can update their own conversations" 
ON public.ai_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: utenti possono eliminare le proprie conversazioni
CREATE POLICY "Users can delete their own conversations" 
ON public.ai_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger per updated_at
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabella per logging utilizzo AI
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  model TEXT NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indici per analytics
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);

-- Abilita RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: admin possono vedere tutti i log
CREATE POLICY "Admins can view all usage logs" 
ON public.ai_usage_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: inserimento pubblico (l'edge function inserisce)
CREATE POLICY "Allow insert from edge function" 
ON public.ai_usage_logs 
FOR INSERT 
WITH CHECK (true);