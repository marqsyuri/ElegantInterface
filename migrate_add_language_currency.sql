-- Migration: Add language and currency columns to users table
-- Execute this script to add the new fields to existing database

-- Add language column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'pt-BR';

-- Add currency column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT 'BRL';

-- Update existing users to have default values (if they are NULL)
UPDATE users 
SET language = 'pt-BR' 
WHERE language IS NULL;

UPDATE users 
SET currency = 'BRL' 
WHERE currency IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.language IS 'User preferred language: pt-BR, en-NZ, en-US, es-ES';
COMMENT ON COLUMN users.currency IS 'User preferred currency: BRL, NZD, USD, EUR, GBP, MXN, ARS, CLP, etc.';

