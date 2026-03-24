-- Migration script to create appointment_staff table
-- This table enables multiple professionals per appointment

-- Create appointment_staff table (many-to-many: multiple staff per appointment)
CREATE TABLE IF NOT EXISTS appointment_staff (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE RESTRICT, -- ON DELETE RESTRICT para evitar exclusão de staff com agendamentos
  is_primary BOOLEAN DEFAULT FALSE,
  role VARCHAR(255), -- Role of the professional in this appointment (main, assistant, supervisor, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (appointment_id, staff_id) -- Um staff pode ser associado apenas uma vez por agendamento
);

-- Create índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_appointment_staff_appointment_id ON appointment_staff(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_staff_staff_id ON appointment_staff(staff_id);

-- Migrate existing data: create appointment_staff entries for existing appointments
-- This ensures backward compatibility with appointments that have staffId
INSERT INTO appointment_staff (appointment_id, staff_id, is_primary, role)
SELECT id, staff_id, TRUE, 'main'
FROM appointments
WHERE staff_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM appointment_staff WHERE appointment_id = appointments.id
);

-- Add comments
COMMENT ON TABLE appointment_staff IS 'Junction table for many-to-many relationship between appointments and staff. Allows multiple professionals per appointment.';
COMMENT ON COLUMN appointment_staff.is_primary IS 'Indicates the primary professional for the appointment';
COMMENT ON COLUMN appointment_staff.role IS 'Role of the professional in this appointment (main, assistant, supervisor, etc.)';

















