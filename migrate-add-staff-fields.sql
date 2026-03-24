-- Migration: Add staff management fields to users table
-- Adds parentUserId and maxStaffCount fields

DO $$
BEGIN
    -- Add parentUserId column if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'parent_user_id'
    ) THEN
        ALTER TABLE users ADD COLUMN parent_user_id INTEGER REFERENCES users(id);
        COMMENT ON COLUMN users.parent_user_id IS 'ID do usuário principal (null para admin, preenchido para staff)';
        RAISE NOTICE 'Column parent_user_id added to users table.';
    ELSE
        RAISE NOTICE 'Column parent_user_id already exists in users table. Skipping.';
    END IF;

    -- Add maxStaffCount column if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'max_staff_count'
    ) THEN
        ALTER TABLE users ADD COLUMN max_staff_count INTEGER DEFAULT 10;
        COMMENT ON COLUMN users.max_staff_count IS 'Quantidade máxima de staffs permitidos por salão';
        RAISE NOTICE 'Column max_staff_count added to users table.';
    ELSE
        RAISE NOTICE 'Column max_staff_count already exists in users table. Skipping.';
    END IF;

    -- Update existing users to have maxStaffCount = 10 if null
    UPDATE users SET max_staff_count = 10 WHERE max_staff_count IS NULL;
    
    RAISE NOTICE 'Migration completed successfully!';
END
$$;

