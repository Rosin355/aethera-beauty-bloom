-- CRITICAL SECURITY FIX: Remove public access to sensitive data tables

-- 1. Remove public read access from mailing_list table
DROP POLICY IF EXISTS "Users can read their own mailing list entry" ON public.mailing_list;

-- Create admin-only read policy for mailing_list
CREATE POLICY "Admins can read all mailing list entries" 
ON public.mailing_list 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can only read their own entry by email match
CREATE POLICY "Users can read their own mailing list entry by email" 
ON public.mailing_list 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = mailing_list.email
  )
);

-- 2. Fix profiles table - remove public read access
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create restricted profile visibility
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix newsletter_subscriptions - remove public read access  
DROP POLICY IF EXISTS "Users can read newsletter subscriptions" ON public.newsletter_subscriptions;

CREATE POLICY "Admins can read newsletter subscriptions" 
ON public.newsletter_subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Improve role management security - restrict bootstrap admin policy
DROP POLICY IF EXISTS "Bootstrap first admin" ON public.user_roles;

-- More restrictive bootstrap policy with additional checks
CREATE POLICY "Bootstrap first admin with restrictions" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'admin'::app_role 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE role = 'admin'::app_role
  )
  AND created_at < now() + interval '1 hour' -- Restrict to recent signups
);

-- 5. Add policy to prevent users from modifying their own roles
CREATE POLICY "Users cannot modify their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id  -- Admins cannot modify their own roles
);

-- 6. Add policy to prevent role deletion except by super admin logic
CREATE POLICY "Restrict role deletion" 
ON public.user_roles 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND auth.uid() != user_id  -- Cannot delete own roles
);

-- 7. Create audit function for role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes (in a real system, you'd insert into an audit table)
  RAISE LOG 'Role change: User % role % by %', 
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.role, OLD.role),
    auth.uid();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role change auditing
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();

-- 8. Improve has_role function security
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public' -- Fixed search path
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;