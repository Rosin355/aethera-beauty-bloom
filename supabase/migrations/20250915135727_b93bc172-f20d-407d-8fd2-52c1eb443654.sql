-- Ensure 'videos' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

update storage.buckets set public = true where id = 'videos';

-- Public read access to videos
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public can view videos'
  ) then
    create policy "Public can view videos"
    on storage.objects for select
    using (bucket_id = 'videos');
  end if;
end $$;

-- Admin-only write access (insert/update/delete)
-- Uses existing public.has_role(auth.uid(),'admin') helper
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins can upload videos'
  ) then
    create policy "Admins can upload videos"
    on storage.objects for insert
    with check (bucket_id = 'videos' and public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins can update videos'
  ) then
    create policy "Admins can update videos"
    on storage.objects for update
    using (bucket_id = 'videos' and public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admins can delete videos'
  ) then
    create policy "Admins can delete videos"
    on storage.objects for delete
    using (bucket_id = 'videos' and public.has_role(auth.uid(), 'admin'));
  end if;
end $$;