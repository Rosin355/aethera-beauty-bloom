
-- 1) Aggiorna la funzione di provisioning utente per ruoli e profili
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
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

-- 2) Crea il trigger su auth.users se non esiste
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

-- 3) Backfill per utenti esistenti (se presenti)
insert into public.user_roles (user_id, role)
select u.id, 'user'::public.app_role
from auth.users u
where not exists (
  select 1 from public.user_roles r where r.user_id = u.id
);

insert into public.profiles (user_id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', u.email)
from auth.users u
where not exists (
  select 1 from public.profiles p where p.user_id = u.id
);

-- 4) Policy di bootstrap per creare il primo admin (solo se nessun admin esiste ancora)
drop policy if exists "Bootstrap first admin" on public.user_roles;

create policy "Bootstrap first admin"
  on public.user_roles
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and role = 'admin'::public.app_role
    and not exists (
      select 1 from public.user_roles where role = 'admin'::public.app_role
    )
  );
