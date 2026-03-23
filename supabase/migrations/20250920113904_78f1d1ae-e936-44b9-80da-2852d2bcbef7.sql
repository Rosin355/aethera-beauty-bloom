-- Remove the insecure policy that allows public access
DROP POLICY IF EXISTS "Allow reading mailing list entry by access token" ON public.mailing_list;

-- Create a secure function for token validation that doesn't expose all data
CREATE OR REPLACE FUNCTION public.validate_access_token(token_to_validate text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'valid', CASE WHEN EXISTS (
      SELECT 1 FROM public.mailing_list 
      WHERE access_token = token_to_validate
    ) THEN true ELSE false END,
    'data', CASE WHEN EXISTS (
      SELECT 1 FROM public.mailing_list 
      WHERE access_token = token_to_validate
    ) THEN (
      SELECT json_build_object(
        'name', name,
        'email', email
      ) FROM public.mailing_list 
      WHERE access_token = token_to_validate
      LIMIT 1
    ) ELSE null END
  );
$$;