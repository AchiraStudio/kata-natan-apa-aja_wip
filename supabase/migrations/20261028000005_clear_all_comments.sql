-- =============================================================================
-- Migration: 20261028000005_clear_all_comments.sql
-- Description: Clear all legacy dummy comments and ensure posts comments_count is 0
-- =============================================================================

-- 1. Delete all existing comments (cascade deletes child replies)
DELETE FROM public.comments;

-- 2. Reset comments_count on all existing posts to 0
UPDATE public.posts SET comments_count = 0;

-- 3. Ensure sync trigger is active and robust
CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = (SELECT count(*) FROM public.comments WHERE post_id = NEW.post_id)
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = (SELECT count(*) FROM public.comments WHERE post_id = OLD.post_id)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_post_comments ON public.comments;
CREATE TRIGGER trg_sync_post_comments
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

