/*
  # Prescription Storage Integration

  1. New Tables
    - `uploaded_prescriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `file_name` (text)
      - `file_url` (text)
      - `uploaded_at` (timestamp)
      - `file_type` (text)
      - `file_size` (text)
      - `status` (text)
      - `ai_summary` (text, optional)

  2. Security
    - Enable RLS on uploaded_prescriptions table
    - Add policies for authenticated users to access only their own files
    - Configure storage bucket policies for prescriptions bucket

  3. Storage
    - Create prescriptions bucket (private access)
    - Set up proper RLS policies for file access
*/

-- Create uploaded_prescriptions table
CREATE TABLE IF NOT EXISTS uploaded_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  file_type text NOT NULL,
  file_size text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'analyzed', 'processing', 'error')),
  ai_summary text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE uploaded_prescriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for uploaded_prescriptions
CREATE POLICY "Users can read own prescriptions"
  ON uploaded_prescriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescriptions"
  ON uploaded_prescriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescriptions"
  ON uploaded_prescriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prescriptions"
  ON uploaded_prescriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_uploaded_prescriptions_user_id ON uploaded_prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_prescriptions_status ON uploaded_prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_uploaded_prescriptions_uploaded_at ON uploaded_prescriptions(uploaded_at);

-- Create storage bucket for prescriptions (this needs to be done via Supabase dashboard or API)
-- The bucket should be created with:
-- - Name: 'prescriptions'
-- - Public: false (private)
-- - File size limit: 10MB
-- - Allowed MIME types: application/pdf, image/jpeg, image/jpg, image/png

-- Note: Storage policies need to be set up in the Supabase dashboard:
-- 1. Go to Storage > Policies
-- 2. Create policy for 'prescriptions' bucket
-- 3. Allow authenticated users to INSERT/SELECT/UPDATE/DELETE their own files
-- Policy example:
-- Name: "Users can upload their own prescription files"
-- Operation: INSERT
-- Target roles: authenticated
-- USING expression: auth.uid()::text = (storage.foldername(name))[1]