-- Trigger per aggiornare likes_count sui post quando viene aggiunto/rimosso un like
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE forum_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE forum_posts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_post_likes
AFTER INSERT OR DELETE ON forum_likes
FOR EACH ROW 
EXECUTE FUNCTION update_post_likes_count();

-- Trigger per aggiornare likes_count sulle risposte quando viene aggiunto/rimosso un like
CREATE OR REPLACE FUNCTION update_reply_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reply_id IS NOT NULL THEN
    UPDATE forum_replies 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.reply_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reply_id IS NOT NULL THEN
    UPDATE forum_replies 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.reply_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_reply_likes
AFTER INSERT OR DELETE ON forum_likes
FOR EACH ROW 
EXECUTE FUNCTION update_reply_likes_count();

-- Trigger per aggiornare replies_count sui post
CREATE OR REPLACE FUNCTION update_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementa solo se la risposta è approvata
    IF NEW.is_approved = true THEN
      UPDATE forum_posts 
      SET replies_count = replies_count + 1 
      WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementa solo se la risposta eliminata era approvata
    IF OLD.is_approved = true THEN
      UPDATE forum_posts 
      SET replies_count = GREATEST(replies_count - 1, 0)
      WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se approvata ora, incrementa
    IF NEW.is_approved = true AND OLD.is_approved = false THEN
      UPDATE forum_posts 
      SET replies_count = replies_count + 1 
      WHERE id = NEW.post_id;
    -- Se rifiutata ora, decrementa
    ELSIF NEW.is_approved = false AND OLD.is_approved = true THEN
      UPDATE forum_posts 
      SET replies_count = GREATEST(replies_count - 1, 0)
      WHERE id = NEW.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_replies_count
AFTER INSERT OR DELETE OR UPDATE ON forum_replies
FOR EACH ROW 
EXECUTE FUNCTION update_post_replies_count();

-- Abilita realtime per forum_posts e forum_replies
ALTER TABLE forum_posts REPLICA IDENTITY FULL;
ALTER TABLE forum_replies REPLICA IDENTITY FULL;
ALTER TABLE forum_likes REPLICA IDENTITY FULL;

-- Aggiungi le tabelle alla pubblicazione realtime (ignora se già esistenti)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_replies;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE forum_likes;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;