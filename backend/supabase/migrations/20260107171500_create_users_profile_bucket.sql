-- Create storage bucket for user profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'users-profile-image',
  'users-profile-image',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Policy: Anyone can view profile images (public bucket)
CREATE POLICY "Anyone can view user profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'users-profile-image');

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'users-profile-image'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'users-profile-image'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'users-profile-image'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
