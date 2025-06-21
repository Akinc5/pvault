/*
  # Create Storage Policies for Existing Buckets

  1. Storage Policies for medical-files bucket
    - Allow authenticated users to upload their own files
    - Allow authenticated users to view their own files
    - Allow authenticated users to update their own files
    - Allow authenticated users to delete their own files

  2. Storage Policies for prescriptions bucket
    - Allow authenticated users to upload their own prescription files
    - Allow authenticated users to view their own prescription files
    - Allow authenticated users to update their own prescription files
    - Allow authenticated users to delete their own prescription files

  3. File Organization
    - Files are organized by user ID in folders: {user_id}/{filename}
    - Policies check that the folder name matches the authenticated user's ID
*/

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own medical files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own medical files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own medical files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own medical files" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own prescription files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own prescription files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own prescription files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own prescription files" ON storage.objects;

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