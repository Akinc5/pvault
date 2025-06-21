/*
  # Add Height Field to Medical Records

  1. Schema Changes
    - Add `height` field to `medical_records` table
    - Add constraint for positive height values

  2. Data Validation
    - Ensure height is a positive number when provided
*/

-- Add height column to medical_records table
DO $$
BEGIN
  -- Add height column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_records' AND column_name = 'height'
  ) THEN
    ALTER TABLE medical_records ADD COLUMN height numeric CHECK (height > 0);
  END IF;
END $$;