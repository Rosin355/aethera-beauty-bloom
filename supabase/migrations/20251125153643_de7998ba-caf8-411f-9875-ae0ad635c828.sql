-- Tabella notifiche in-app
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('post_like', 'post_reply', 'reply_like', 'new_post', 'post_approved', 'post_pinned')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_user_id UUID,
  related_post_id UUID,
  related_reply_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index per performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS per notifiche
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger per creare notifica quando qualcuno mette like a un post
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  liker_name TEXT;
  post_title TEXT;
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    -- Get post author and title
    SELECT author_id, title INTO post_author, post_title
    FROM forum_posts
    WHERE id = NEW.post_id;
    
    -- Don't notify if user likes their own post
    IF post_author != NEW.user_id THEN
      -- Get liker display name
      SELECT display_name INTO liker_name
      FROM profiles
      WHERE user_id = NEW.user_id;
      
      INSERT INTO notifications (user_id, type, title, message, link, related_user_id, related_post_id)
      VALUES (
        post_author,
        'post_like',
        'Nuovo like',
        COALESCE(liker_name, 'Qualcuno') || ' ha messo like al tuo post "' || SUBSTRING(post_title, 1, 50) || '"',
        '/dashboard/community/post/' || NEW.post_id,
        NEW.user_id,
        NEW.post_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_like
  AFTER INSERT ON forum_likes
  FOR EACH ROW
  WHEN (NEW.post_id IS NOT NULL)
  EXECUTE FUNCTION notify_post_like();

-- Trigger per notifica quando qualcuno risponde a un post
CREATE OR REPLACE FUNCTION notify_post_reply()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  replier_name TEXT;
  post_title TEXT;
BEGIN
  -- Get post author and title
  SELECT author_id, title INTO post_author, post_title
  FROM forum_posts
  WHERE id = NEW.post_id;
  
  -- Don't notify if user replies to their own post
  IF post_author != NEW.author_id AND NEW.is_approved = true THEN
    -- Get replier display name
    SELECT display_name INTO replier_name
    FROM profiles
    WHERE user_id = NEW.author_id;
    
    INSERT INTO notifications (user_id, type, title, message, link, related_user_id, related_post_id, related_reply_id)
    VALUES (
      post_author,
      'post_reply',
      'Nuova risposta',
      COALESCE(replier_name, 'Qualcuno') || ' ha risposto al tuo post "' || SUBSTRING(post_title, 1, 50) || '"',
      '/dashboard/community/post/' || NEW.post_id,
      NEW.author_id,
      NEW.post_id,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_reply
  AFTER INSERT ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_reply();

-- Trigger per notifica quando un admin approva un post
CREATE OR REPLACE FUNCTION notify_post_approved()
RETURNS TRIGGER AS $$
DECLARE
  author_name TEXT;
BEGIN
  -- Solo se il post passa da non approvato ad approvato
  IF OLD.is_approved = false AND NEW.is_approved = true THEN
    INSERT INTO notifications (user_id, type, title, message, link, related_post_id)
    VALUES (
      NEW.author_id,
      'post_approved',
      'Post approvato',
      'Il tuo post "' || SUBSTRING(NEW.title, 1, 50) || '" è stato approvato ed è ora visibile',
      '/dashboard/community/post/' || NEW.id,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_approved
  AFTER UPDATE ON forum_posts
  FOR EACH ROW
  WHEN (OLD.is_approved IS DISTINCT FROM NEW.is_approved)
  EXECUTE FUNCTION notify_post_approved();

-- Trigger per notifica quando un post viene fissato
CREATE OR REPLACE FUNCTION notify_post_pinned()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo se il post passa da non fissato a fissato
  IF OLD.is_pinned = false AND NEW.is_pinned = true THEN
    INSERT INTO notifications (user_id, type, title, message, link, related_post_id)
    VALUES (
      NEW.author_id,
      'post_pinned',
      'Post in evidenza',
      'Il tuo post "' || SUBSTRING(NEW.title, 1, 50) || '" è stato messo in evidenza',
      '/dashboard/community/post/' || NEW.id,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_post_pinned
  AFTER UPDATE ON forum_posts
  FOR EACH ROW
  WHEN (OLD.is_pinned IS DISTINCT FROM NEW.is_pinned)
  EXECUTE FUNCTION notify_post_pinned();