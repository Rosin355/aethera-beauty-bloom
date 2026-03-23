-- CRITICAL SECURITY FIX: Fix existing policies step by step

-- 1. Drop all existing problematic policies first
DROP POLICY IF EXISTS "Admins can read all mailing list entries" ON public.mailing_list;
DROP POLICY IF EXISTS "Users can read their own mailing list entry" ON public.mailing_list; 
DROP POLICY IF EXISTS "Users can read their own mailing list entry by email" ON public.mailing_list;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can read newsletter subscriptions" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Bootstrap first admin" ON public.user_roles;
DROP POLICY IF EXISTS "Bootstrap first admin with restrictions" ON public.user_roles;

-- 2. Create secure policies for mailing_list
CREATE POLICY "Admins can read mailing list" 
ON public.mailing_list 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Create secure policies for profiles  
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create secure policies for newsletter_subscriptions
CREATE POLICY "Admins can read newsletters" 
ON public.newsletter_subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Create restricted bootstrap policy
CREATE POLICY "Restricted bootstrap admin" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'admin'::app_role 
  AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role)
);