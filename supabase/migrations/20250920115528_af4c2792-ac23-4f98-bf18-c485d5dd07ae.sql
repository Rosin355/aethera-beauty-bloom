-- Correggi il video ID per il video completo nella pagina Welcome
UPDATE site_videos 
SET youtube_video_id = 'SQOT-gujMT4',
    updated_at = now()
WHERE video_type = 'full';