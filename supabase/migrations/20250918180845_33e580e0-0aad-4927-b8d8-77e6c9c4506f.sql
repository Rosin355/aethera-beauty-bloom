-- Final security improvements

-- 1. Fix the overly permissive "Users can view all roles" policy 
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Replace with admin-only visibility for all roles
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add role change prevention policies if not exist
DROP POLICY IF EXISTS "Users cannot modify their own roles" ON public.user_roles;
CREATE POLICY "Prevent self role modification" 
ON public.user_roles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id
);

-- 3. Create audit table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource text NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));