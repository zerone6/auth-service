-- Migration: 001_multi_provider
-- Description: Convert google_id to provider + provider_id for multi-provider OAuth support
-- Date: 2025-12-28
-- Author: Claude Code

-- ============================================
-- MIGRATION SCRIPT
-- ============================================

BEGIN;

-- Step 1: Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

-- Step 2: Migrate existing data (google_id → provider='google', provider_id=google_id)
UPDATE users
SET provider = 'google', provider_id = google_id
WHERE provider IS NULL AND google_id IS NOT NULL;

-- Step 3: Set NOT NULL constraints (after data migration)
ALTER TABLE users ALTER COLUMN provider SET NOT NULL;
ALTER TABLE users ALTER COLUMN provider_id SET NOT NULL;

-- Step 4: Add composite unique constraint
ALTER TABLE users ADD CONSTRAINT unique_provider_user UNIQUE (provider, provider_id);

-- Step 5: Drop old column and its constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_google_id_key;
DROP INDEX IF EXISTS idx_users_google_id;
ALTER TABLE users DROP COLUMN IF EXISTS google_id;

-- Step 6: Create new indexes
CREATE INDEX IF NOT EXISTS idx_users_provider_provider_id ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);

-- Step 7: Add CHECK constraint for provider values
ALTER TABLE users ADD CONSTRAINT check_provider_values
CHECK (provider IN ('google', 'naver', 'line', 'apple', 'kakao', 'github'));

-- Step 8: Update comments
COMMENT ON COLUMN users.provider IS 'OAuth 프로바이더: google, naver, line, apple, kakao, github';
COMMENT ON COLUMN users.provider_id IS '각 OAuth 프로바이더의 사용자 고유 ID';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================
-- SELECT provider, COUNT(*) FROM users GROUP BY provider;
-- SELECT * FROM users LIMIT 5;
-- \d users
