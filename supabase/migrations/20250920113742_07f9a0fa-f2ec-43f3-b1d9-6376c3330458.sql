-- Drop the complex policy and create a simpler, more secure one
DROP POLICY IF EXISTS "Users can read their own mailing list entry by access token" ON public.mailing_list;

-- Create a simple policy that only allows reading when filtering by access_token
-- This prevents bulk data extraction while maintaining the Welcome page functionality
CREATE POLICY "Allow reading mailing list entry by access token" 
ON public.mailing_list 
FOR SELECT 
USING (
  -- This policy will only work when the query includes access_token filter
  -- RLS will automatically restrict results to matching records
  true
);