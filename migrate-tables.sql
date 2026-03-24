-- Migration script to add appointment_staff and staff_procedures tables
-- This enables multiple professionals per appointment and procedure-staff associations

-- Create staff_procedures table (many-to-many: which procedures each staff can perform)
CREATE TABLE IF NOT EXISTS staff_procedures (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  procedure_id INTEGER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(staff_id, procedure_id) -- Prevent duplicate associations
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_procedures_staff_id ON staff_procedures(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_procedures_procedure_id ON staff_procedures(procedure_id);

-- Create appointment_staff table (many-to-many: multiple staff per appointment)
CREATE TABLE IF NOT EXISTS appointment_staff (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  is_primary BOOLEAN DEFAULT false, -- Indicates the primary professional
  role VARCHAR(50), -- Optional: 'main', 'assistant', 'supervisor', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointment_staff_appointment_id ON appointment_staff(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_staff_staff_id ON appointment_staff(staff_id);

-- Migrate existing data (optional - for backward compatibility)
-- If appointments already have staffId, create records in the new table
INSERT INTO appointment_staff (appointment_id, staff_id, is_primary, role)
SELECT id, staff_id, true, 'main'
FROM appointments
WHERE staff_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM appointment_staff WHERE appointment_id = appointments.id
);

-- Add comments
COMMENT ON TABLE staff_procedures IS 'Junction table for many-to-many relationship between staff and procedures. Associates which procedures each staff member can perform.';
COMMENT ON TABLE appointment_staff IS 'Junction table for many-to-many relationship between appointments and staff. Allows multiple professionals per appointment.';
COMMENT ON COLUMN appointment_staff.is_primary IS 'Indicates the primary professional for the appointment';
COMMENT ON COLUMN appointment_staff.role IS 'Role of the professional in this appointment (main, assistant, supervisor, etc.)';

















