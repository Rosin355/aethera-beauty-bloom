-- Ensure bucket exists
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- Increase max file size to 400MB (400 * 1024 * 1024 = 419430400 bytes)
update storage.buckets
set file_size_limit = 419430400
where id = 'videos';

-- (Optional) Allow common video mime types explicitly
update storage.buckets
set allowed_mime_types = array['video/mp4','video/quicktime','video/x-msvideo','video/mpeg','video/webm']
where id = 'videos';