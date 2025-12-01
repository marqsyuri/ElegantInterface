-- Check if banner fields exist in users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('login_banner_url', 'dashboard_banner_url');


