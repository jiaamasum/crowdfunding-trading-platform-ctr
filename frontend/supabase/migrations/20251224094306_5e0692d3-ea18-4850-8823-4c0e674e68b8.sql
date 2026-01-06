-- Create storage bucket for project media (images and 3D models)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-media', 
  'project-media', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
);

-- Policy: Anyone can view project media (public bucket)
CREATE POLICY "Anyone can view project media"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-media');

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload project media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own project media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own project media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);