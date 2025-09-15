-- Ensure the 'videos' bucket exists and is public
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- Increase size limit to 400MB and allow common video MIME types
update storage.buckets
set file_size_limit = 419430400, -- 400 MB
    allowed_mime_types = array['video/mp4','video/quicktime','video/x-msvideo','video/webm','video/mpeg']
where id = 'videos';