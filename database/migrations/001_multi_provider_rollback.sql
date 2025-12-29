-- Rollback: 001_multi_provider
-- Description: Revert multi-provider OAuth changes back to google_id
-- Date: 2025-12-28
-- Author: Claude Code
-- WARNING: This rollback only works if all users have provider='google'

-- ============================================
-- ROLLBACK SCRIPT
-- ============================================

BEGIN;

-- Step 1: Add back google_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- Step 2: Migrate data back (only google provider supported)
UPDATE users
SET google_id = provider_id
WHERE provider = 'google';

-- Step 3: Check for non-google providers (will fail if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE provider != 'google') THEN
        RAISE EXCEPTION 'Cannot rollback: non-google providers exist in database';
    END IF;
END $$;

-- Step 4: Set NOT NULL on google_id
ALTER TABLE users ALTER COLUMN google_id SET NOT NULL;

-- Step 5: Add unique constraint back
ALTER TABLE users ADD CONSTRAINT users_google_id_key UNIQUE (google_id);

-- Step 6: Drop new constraints and indexes
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_provider_values;
ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_provider_user;
DROP INDEX IF EXISTS idx_users_provider_provider_id;
DROP INDEX IF EXISTS idx_users_provider;

-- Step 7: Drop new columns
ALTER TABLE users DROP COLUMN IF EXISTS provider;
ALTER TABLE users DROP COLUMN IF EXISTS provider_id;

-- Step 8: Recreate original index
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Step 9: Restore comment
COMMENT ON COLUMN users.google_id IS 'Google OAuth User ID';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run after rollback)
-- ============================================
-- SELECT google_id, email FROM users LIMIT 5;
-- \d users
