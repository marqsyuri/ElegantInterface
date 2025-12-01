-- Add banner URL fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS login_banner_url VARCHAR,
ADD COLUMN IF NOT EXISTS dashboard_banner_url VARCHAR;


