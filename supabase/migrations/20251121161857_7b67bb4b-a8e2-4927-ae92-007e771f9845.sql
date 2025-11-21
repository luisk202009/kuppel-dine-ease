-- Add setup_completed flag to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_setup_completed ON users(setup_completed);

COMMENT ON COLUMN users.setup_completed IS 'Indicates if user has completed initial onboarding wizard';