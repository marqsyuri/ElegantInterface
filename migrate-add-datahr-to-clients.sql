-- Migration script to add datahr column to clients table
-- This column stores the date and time of the last appointment

-- Add datahr column to clients table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'datahr'
    ) THEN
        ALTER TABLE clients 
        ADD COLUMN datahr TIMESTAMP;
        
        COMMENT ON COLUMN clients.datahr IS 'Data e hora do último agendamento realizado';
    END IF;
END $$;
