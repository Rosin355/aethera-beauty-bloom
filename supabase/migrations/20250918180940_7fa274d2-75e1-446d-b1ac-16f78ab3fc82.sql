-- Fix the audit function that still has mutable search path
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'  -- Fixed search path
AS $$
BEGIN
  -- Log role changes (in a real system, you'd insert into an audit table)
  RAISE LOG 'Role change: User % role % by %', 
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.role, OLD.role),
    auth.uid();
  
  RETURN COALESCE(NEW, OLD);
END;
$$;