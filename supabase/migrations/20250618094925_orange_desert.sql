/*
  # Add Vitals Fields to Medical Records

  1. Schema Changes
    - Add vitals fields to `medical_records` table:
      - `weight` (numeric)
      - `blood_pressure` (text)
      - `heart_rate` (integer)
      - `blood_sugar` (numeric, optional)

  2. Data Validation
    - Add constraints for positive values where appropriate
*/

-- Add vitals columns to medical_records table
DO $$
BEGIN
  -- Add weight column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_records' AND column_name = 'weight'
  ) THEN
    ALTER TABLE medical_records ADD COLUMN weight numeric CHECK (weight > 0);
  END IF;

  -- Add blood_pressure column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_records' AND column_name = 'blood_pressure'
  ) THEN
    ALTER TABLE medical_records ADD COLUMN blood_pressure text;
  END IF;

  -- Add heart_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_records' AND column_name = 'heart_rate'
  ) THEN
    ALTER TABLE medical_records ADD COLUMN heart_rate integer CHECK (heart_rate > 0);
  END IF;

  -- Add blood_sugar column (optional)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_records' AND column_name = 'blood_sugar'
  ) THEN
    ALTER TABLE medical_records ADD COLUMN blood_sugar numeric CHECK (blood_sugar > 0);
  END IF;
END $$;