-- Migration script to add staffId to appointment_procedures table
-- This enables tracking which professional performed each specific procedure
-- Essential for accurate payslip calculations with commission per procedure

-- Add staffId column to appointment_procedures table
ALTER TABLE appointment_procedures 
ADD COLUMN IF NOT EXISTS staff_id INTEGER REFERENCES staff(id);

-- Create index for better performance when querying by staff
CREATE INDEX IF NOT EXISTS idx_appointment_procedures_staff_id 
ON appointment_procedures(staff_id);

-- Migrate existing data: set staffId from appointment's staffId for backward compatibility
UPDATE appointment_procedures ap
SET staff_id = a.staff_id
FROM appointments a
WHERE ap.appointment_id = a.id
AND ap.staff_id IS NULL
AND a.staff_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN appointment_procedures.staff_id IS 'Professional who performed this specific procedure. Used for accurate payslip and commission calculations.';

















