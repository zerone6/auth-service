-- Calculator Database Schema
-- Migration: Add school and calculator data tables

-- Schools table (학교 정보)
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(20) NOT NULL CHECK (pattern_type IN ('simple', 'ratio')),
    ratio_test INTEGER DEFAULT 7,
    ratio_naishin INTEGER DEFAULT 3,
    pass_rate_80 DECIMAL(10, 2),  -- 80% 합격 점수
    pass_rate_60 DECIMAL(10, 2),  -- 60% 합격 점수
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, created_by)  -- 같은 사용자가 동일한 학교명을 중복 생성할 수 없음
);

-- User calculator data (사용자별 계산기 데이터)
CREATE TABLE IF NOT EXISTS user_calculator_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 내신 성적 (9과목)
    grade_japanese INTEGER DEFAULT 3 CHECK (grade_japanese >= 1 AND grade_japanese <= 5),
    grade_math INTEGER DEFAULT 3 CHECK (grade_math >= 1 AND grade_math <= 5),
    grade_english INTEGER DEFAULT 3 CHECK (grade_english >= 1 AND grade_english <= 5),
    grade_social INTEGER DEFAULT 3 CHECK (grade_social >= 1 AND grade_social <= 5),
    grade_science INTEGER DEFAULT 3 CHECK (grade_science >= 1 AND grade_science <= 5),
    grade_tech_home INTEGER DEFAULT 3 CHECK (grade_tech_home >= 1 AND grade_tech_home <= 5),
    grade_pe INTEGER DEFAULT 3 CHECK (grade_pe >= 1 AND grade_pe <= 5),
    grade_music INTEGER DEFAULT 3 CHECK (grade_music >= 1 AND grade_music <= 5),
    grade_art INTEGER DEFAULT 3 CHECK (grade_art >= 1 AND grade_art <= 5),

    -- 학력검사 점수 (5과목, 0-100점)
    exam_japanese INTEGER DEFAULT 0 CHECK (exam_japanese >= 0 AND exam_japanese <= 100),
    exam_math INTEGER DEFAULT 0 CHECK (exam_math >= 0 AND exam_math <= 100),
    exam_english INTEGER DEFAULT 0 CHECK (exam_english >= 0 AND exam_english <= 100),
    exam_social INTEGER DEFAULT 0 CHECK (exam_social >= 0 AND exam_social <= 100),
    exam_science INTEGER DEFAULT 0 CHECK (exam_science >= 0 AND exam_science <= 100),

    -- 과목별 가중치
    use_weights BOOLEAN DEFAULT FALSE,
    weight_japanese DECIMAL(3, 1) DEFAULT 1.0,
    weight_math DECIMAL(3, 1) DEFAULT 1.0,
    weight_english DECIMAL(3, 1) DEFAULT 1.0,
    weight_social DECIMAL(3, 1) DEFAULT 1.0,
    weight_science DECIMAL(3, 1) DEFAULT 1.0,

    -- 추가 점수
    use_interview BOOLEAN DEFAULT FALSE,
    use_essay BOOLEAN DEFAULT FALSE,
    use_practical BOOLEAN DEFAULT FALSE,
    use_bonus BOOLEAN DEFAULT FALSE,
    use_speaking BOOLEAN DEFAULT FALSE,

    additional_interview INTEGER DEFAULT 0,
    additional_essay INTEGER DEFAULT 0,
    additional_practical INTEGER DEFAULT 0,
    additional_bonus INTEGER DEFAULT 0,
    additional_speaking INTEGER DEFAULT 0,
    speaking_grade VARCHAR(1) DEFAULT 'A' CHECK (speaking_grade IN ('A', 'B', 'C', 'D', 'E', 'F')),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)  -- 한 사용자당 하나의 계산기 데이터
);

-- User selected schools (사용자가 선택한 학교 목록)
CREATE TABLE IF NOT EXISTS user_selected_schools (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, school_id)  -- 같은 학교를 중복 선택할 수 없음
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schools_created_by ON schools(created_by);
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_user_calculator_data_user_id ON user_calculator_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_selected_schools_user_id ON user_selected_schools(user_id);
CREATE INDEX IF NOT EXISTS idx_user_selected_schools_school_id ON user_selected_schools(school_id);
CREATE INDEX IF NOT EXISTS idx_user_selected_schools_display_order ON user_selected_schools(user_id, display_order);

-- Trigger for schools table
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_calculator_data table
CREATE TRIGGER update_user_calculator_data_updated_at
    BEFORE UPDATE ON user_calculator_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE schools IS '학교 정보 테이블';
COMMENT ON TABLE user_calculator_data IS '사용자별 계산기 입력 데이터';
COMMENT ON TABLE user_selected_schools IS '사용자가 선택한 학교 목록';

COMMENT ON COLUMN schools.pattern_type IS '계산 패턴: simple(단순형), ratio(비율형)';
COMMENT ON COLUMN schools.pass_rate_80 IS '80% 합격 확률 점수';
COMMENT ON COLUMN schools.pass_rate_60 IS '60% 합격 확률 점수';
COMMENT ON COLUMN user_calculator_data.use_weights IS '과목별 가중치 사용 여부';
COMMENT ON COLUMN user_calculator_data.speaking_grade IS '영어 스피킹 등급: A(20점), B(16점), C(12점), D(8점), E(4점), F(0점)';
