-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true);

-- Create storage policies for videos bucket
CREATE POLICY "Public video access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Admin can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'videos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can update videos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'videos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can delete videos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'videos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);