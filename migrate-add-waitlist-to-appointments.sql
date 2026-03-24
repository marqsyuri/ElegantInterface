-- Migration: Add waitlist field to appointments table
-- Adds waitlist boolean field for waitlist functionality

DO $$
BEGIN
    -- Add waitlist column if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'waitlist'
    ) THEN
        ALTER TABLE appointments ADD COLUMN waitlist BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN appointments.waitlist IS 'Indica se o agendamento está na lista de espera';
        RAISE NOTICE 'Column waitlist added to appointments table.';
    ELSE
        RAISE NOTICE 'Column waitlist already exists in appointments table. Skipping.';
    END IF;

    -- Update existing appointments to have waitlist = false if null
    UPDATE appointments SET waitlist = FALSE WHERE waitlist IS NULL;
    
    RAISE NOTICE 'Migration completed successfully!';
END
$$;







