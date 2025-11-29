-- Migration: Make schools shared across all users
-- Date: 2025-11-29
-- Description: Remove user-specific constraint and make school names globally unique

-- Step 1: Drop the existing unique constraint on (name, created_by)
ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_name_created_by_key;

-- Step 2: Add new unique constraint on name only
-- This ensures school names are globally unique across all users
ALTER TABLE schools ADD CONSTRAINT schools_name_key UNIQUE (name);

-- Note: This migration may fail if there are duplicate school names created by different users
-- In that case, you need to manually merge or rename duplicate schools before running this migration

-- Comments
COMMENT ON CONSTRAINT schools_name_key ON schools IS '학교명은 전체 사용자 간 고유해야 함 (공유 학교 리스트)';
