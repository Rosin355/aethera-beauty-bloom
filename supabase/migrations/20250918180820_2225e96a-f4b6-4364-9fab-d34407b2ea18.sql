-- Fix remaining function security issues

-- Fix search path for existing functions that still have mutable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'  -- Fixed search path
AS $function$
begin
  -- Assegna ruolo "user" di default
  insert into public.user_roles (user_id, role)
  values (new.id, 'user'::public.app_role)
  on conflict (user_id, role) do nothing;

  -- Crea profilo con display_name (da metadata o email)
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  )
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

-- Fix search path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'  -- Fixed search path
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;