/*
  # Prescription Storage Setup

  1. Storage Bucket
    - Create 'prescriptions' bucket for prescription files
    - Set as private bucket with file size and type restrictions

  2. Storage Policies
    - Allow authenticated users to manage their own prescription files
    - Secure access based on user folder structure

  3. Database Integration
    - Ensure uploaded_prescriptions table works with storage
*/

-- Create storage bucket for prescription files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescriptions',
  'prescriptions',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for prescriptions bucket
CREATE POLICY "Users can upload their own prescription files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prescriptions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own prescription files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own prescription files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own prescription files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'prescriptions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);