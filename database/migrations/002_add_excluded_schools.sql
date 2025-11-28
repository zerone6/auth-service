-- Add user excluded schools table
-- Migration: Allow users to exclude schools from their selection list

-- User excluded schools (사용자가 제외한 학교 목록)
CREATE TABLE IF NOT EXISTS user_excluded_schools (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    excluded_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, school_id)  -- 같은 학교를 중복 제외할 수 없음
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_excluded_schools_user_id ON user_excluded_schools(user_id);
CREATE INDEX IF NOT EXISTS idx_user_excluded_schools_school_id ON user_excluded_schools(school_id);

-- Comments
COMMENT ON TABLE user_excluded_schools IS '사용자가 제외한 학교 목록 (보이지 않음)';
COMMENT ON COLUMN user_excluded_schools.excluded_at IS '제외한 시각';
