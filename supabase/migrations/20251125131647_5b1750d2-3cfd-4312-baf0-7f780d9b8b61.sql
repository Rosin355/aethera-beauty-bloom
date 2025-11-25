-- Step 1.1: Fix RLS for Profiles - Add is_public column and new policy

-- Add is_public column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Create policy to allow authenticated users to view public profiles
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_public = true);

-- Update existing RLS to allow viewing all profiles (public + own)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_public = true);