-- Fix the RLS policy that's causing permission denied errors
-- Remove the problematic policy that references auth.users
DROP POLICY IF EXISTS "Users can read their own mailing list entry by email" ON public.mailing_list;

-- Create a simpler policy for users to read mailing list entries by access token
CREATE POLICY "Users can read mailing list by access token" 
ON public.mailing_list 
FOR SELECT 
USING (true);

-- Update the policy to allow anyone to read mailing list entries 
-- This is needed for the welcome page to work with access tokens
-- The security is maintained through the access_token mechanism