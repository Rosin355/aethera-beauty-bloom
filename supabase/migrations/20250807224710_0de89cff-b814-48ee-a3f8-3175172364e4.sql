-- Create profiles table for professional networking
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  skills TEXT[],
  experience_years INTEGER,
  location TEXT,
  website_url TEXT,
  cv_file_url TEXT,
  avatar_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum categories
CREATE TABLE public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6AA8B3',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum posts
CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  category_id UUID REFERENCES public.forum_categories(id),
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum replies
CREATE TABLE public.forum_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  author_id UUID NOT NULL,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job postings
CREATE TABLE public.job_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT,
  salary_range TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'freelance', 'internship')),
  required_skills TEXT[],
  posted_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job applications
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum likes
CREATE TABLE public.forum_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT forum_likes_single_target CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR 
    (post_id IS NULL AND reply_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, reply_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for forum categories (public read, admin write)
CREATE POLICY "Categories are viewable by everyone" ON public.forum_categories
  FOR SELECT USING (true);

-- RLS Policies for forum posts
CREATE POLICY "Approved posts are viewable by everyone" ON public.forum_posts
  FOR SELECT USING (is_approved = true OR auth.uid() = author_id);

CREATE POLICY "Users can create posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for forum replies
CREATE POLICY "Approved replies are viewable by everyone" ON public.forum_replies
  FOR SELECT USING (is_approved = true OR auth.uid() = author_id);

CREATE POLICY "Users can create replies" ON public.forum_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own replies" ON public.forum_replies
  FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for job postings
CREATE POLICY "Approved jobs are viewable by everyone" ON public.job_postings
  FOR SELECT USING (is_approved = true OR auth.uid() = posted_by);

CREATE POLICY "Users can create job postings" ON public.job_postings
  FOR INSERT WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can update their own job postings" ON public.job_postings
  FOR UPDATE USING (auth.uid() = posted_by);

-- RLS Policies for job applications
CREATE POLICY "Users can view applications for their jobs" ON public.job_applications
  FOR SELECT USING (
    auth.uid() = applicant_id OR 
    auth.uid() IN (SELECT posted_by FROM public.job_postings WHERE id = job_id)
  );

CREATE POLICY "Users can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

-- RLS Policies for forum likes
CREATE POLICY "Users can view all likes" ON public.forum_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON public.forum_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON public.forum_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default forum categories
INSERT INTO public.forum_categories (name, description, color) VALUES
  ('Networking', 'Connettiti con altri professionisti del settore', '#6AA8B3'),
  ('Consigli Tecnici', 'Condividi e ricevi consigli sui trattamenti', '#E46A39'),
  ('Business', 'Discussioni su gestione del salone e crescita del business', '#C2977E'),
  ('Opportunità di Lavoro', 'Cerca e offri opportunità lavorative', '#CBD8D4'),
  ('Eventi e Formazione', 'Discussioni su corsi, workshop e eventi del settore', '#6AA8B3');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();