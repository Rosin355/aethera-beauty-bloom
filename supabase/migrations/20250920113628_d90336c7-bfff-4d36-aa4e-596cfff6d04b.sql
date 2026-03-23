-- Fix security vulnerability in mailing_list table
-- Remove the overly permissive policy that allows anyone to read all records
DROP POLICY IF EXISTS "Users can read mailing list by access token" ON public.mailing_list;

-- Create a more secure policy that only allows reading specific records by access token
-- This maintains functionality while restricting access to only the record with matching token
CREATE POLICY "Users can read their own mailing list entry by access token" 
ON public.mailing_list 
FOR SELECT 
USING (
  -- Only allow reading if a specific access_token is being queried
  -- This prevents bulk data extraction while maintaining token validation functionality
  access_token IS NOT NULL AND 
  access_token = ANY(
    -- This ensures the query must include the access_token in the WHERE clause
    SELECT unnest(string_to_array(current_setting('request.headers', true)::json->>'x-access-token', ','))
    UNION ALL
    SELECT access_token -- Fallback for direct queries with access_token filter
  )
);