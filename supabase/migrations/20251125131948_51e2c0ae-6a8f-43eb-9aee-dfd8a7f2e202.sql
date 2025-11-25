-- Add foreign keys for proper relations between tables

-- Add foreign key from forum_posts.author_id to profiles.user_id
ALTER TABLE public.forum_posts
ADD CONSTRAINT forum_posts_author_fk 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from forum_replies.author_id to profiles.user_id  
ALTER TABLE public.forum_replies
ADD CONSTRAINT forum_replies_author_fk
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from job_postings.posted_by to profiles.user_id
ALTER TABLE public.job_postings
ADD CONSTRAINT job_postings_posted_by_fk
FOREIGN KEY (posted_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;