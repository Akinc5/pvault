/*
  # Create Storage Bucket and Policies for Medical Files

  1. Storage Setup
    - Create 'medical-files' bucket for storing medical documents
    - Set up RLS policies for secure file access
    - Configure bucket settings for medical file types

  2. Security
    - Private bucket (not publicly accessible)
    - Users can only access their own files
    - Proper file type restrictions
*/

-- Create storage bucket for medical files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-files',
  'medical-files',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for medical-files bucket
CREATE POLICY "Users can upload their own medical files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own medical files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own medical files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own medical files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);