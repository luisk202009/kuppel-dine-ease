-- Add tour_completed flag to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_tour_completed ON users(tour_completed);

COMMENT ON COLUMN users.tour_completed IS 'Indicates if user has completed the dashboard tour guide';