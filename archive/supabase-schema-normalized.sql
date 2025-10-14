-- Vihaan's Swim Tracker - Normalized Database Schema
-- Proper relational design: Store facts, calculate derived data

-- ============================================
-- DROP EXISTING OBJECTS (for clean migration)
-- ============================================
DROP VIEW IF EXISTS progress_report CASCADE;
DROP VIEW IF EXISTS latest_times_per_event CASCADE;
DROP VIEW IF EXISTS personal_bests CASCADE;
DROP VIEW IF EXISTS competition_results_with_standards CASCADE;

-- Drop all tables to ensure clean migration
DROP TABLE IF EXISTS competition_results CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS improvement_goals CASCADE;
DROP TABLE IF EXISTS team_progression CASCADE;
DROP TABLE IF EXISTS time_standards CASCADE;

-- ============================================
-- 1. COMPETITION RESULTS TABLE (NORMALIZED)
-- ============================================
-- Store ONLY factual data, no calculated fields
CREATE TABLE competition_results (
    id BIGSERIAL PRIMARY KEY,

    -- Event identification
    event_name TEXT NOT NULL,
    meet_name TEXT,
    event_date DATE NOT NULL,

    -- Performance data (facts only)
    time_formatted TEXT NOT NULL,
    time_seconds DECIMAL(10,2) NOT NULL,

    -- Event details
    course_type TEXT CHECK (course_type IN ('SCY', 'LCM', 'SCM')),
    distance TEXT,
    stroke TEXT,

    -- Competition metadata
    points INTEGER,
    age INTEGER,
    team TEXT,

    -- Optional notes
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_competition_results_date ON competition_results(event_date DESC);
CREATE INDEX idx_competition_results_event ON competition_results(event_name);
CREATE INDEX idx_competition_results_team ON competition_results(team);
CREATE INDEX idx_competition_results_time ON competition_results(event_name, time_seconds);

-- ============================================
-- 2. TIME STANDARDS REFERENCE TABLE
-- ============================================
CREATE TABLE time_standards (
    id BIGSERIAL PRIMARY KEY,
    event_name TEXT NOT NULL,
    age_group TEXT NOT NULL,

    -- Standard times (in seconds, fastest to slowest)
    aaaa_time DECIMAL(10,2),
    aaa_time DECIMAL(10,2),
    aa_time DECIMAL(10,2),
    a_time DECIMAL(10,2),
    bb_time DECIMAL(10,2),
    b_time DECIMAL(10,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_name, age_group)
);

-- Insert USA Swimming standards for age 10
INSERT INTO time_standards (event_name, age_group, aaaa_time, aaa_time, aa_time, a_time, bb_time, b_time) VALUES
('50 FR SCY', '10', 27.79, 29.29, 30.99, 33.29, 35.49, 38.99),
('100 FR SCY', '10', 60.99, 64.29, 67.99, 73.39, 78.39, 86.39),
('200 FR SCY', '10', 133.29, 141.09, 149.99, 163.59, 176.39, 196.19),
('50 BK SCY', '10', 32.89, 34.69, 36.69, 39.39, 42.09, 46.29),
('100 BK SCY', '10', 71.49, 75.69, 80.29, 87.69, 94.49, 104.99),
('50 BR SCY', '10', 36.69, 38.69, 40.99, 44.09, 47.09, 51.79),
('100 BR SCY', '10', 81.09, 85.99, 91.39, 99.49, 106.99, 120.09),
('50 FL SCY', '10', 31.29, 33.09, 35.09, 37.79, 40.49, 44.59),
('100 FL SCY', '10', 71.19, 75.39, 79.99, 87.09, 93.69, 103.89),
('100 IM SCY', '10', 70.59, 74.79, 79.39, 86.59, 93.29, 103.39),
('200 IM SCY', '10', 153.09, 161.39, 170.49, 184.99, 198.79, 220.79)
ON CONFLICT (event_name, age_group) DO NOTHING;

-- ============================================
-- 3. PRACTICE SESSIONS TABLE
-- ============================================
CREATE TABLE practice_sessions (
    id BIGSERIAL PRIMARY KEY,
    practice_date DATE NOT NULL,
    team_coach TEXT,
    duration_minutes INTEGER,
    total_distance_yards INTEGER,

    -- Session details
    focus_areas TEXT[],
    intensity TEXT CHECK (intensity IN ('Light', 'Moderate', 'Hard', 'Very Hard')),
    energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),

    -- Feedback and notes
    key_achievements TEXT,
    areas_to_improve TEXT,
    coach_feedback TEXT,
    next_practice_goal TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_practice_sessions_date ON practice_sessions(practice_date DESC);

-- ============================================
-- 4. IMPROVEMENT GOALS TABLE
-- ============================================
CREATE TABLE improvement_goals (
    id BIGSERIAL PRIMARY KEY,
    goal_title TEXT NOT NULL,
    category TEXT,
    events TEXT[],

    -- Current vs target
    current_time_level TEXT,
    target_time_level TEXT,
    target_date DATE,

    -- Progress tracking
    priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT CHECK (status IN ('Not Started', 'In Progress', 'Achieved', 'On Hold')),
    progress_pct DECIMAL(5,2),

    -- Action plan
    action_steps TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    achieved_at TIMESTAMPTZ
);

CREATE INDEX idx_improvement_goals_status ON improvement_goals(status);
CREATE INDEX idx_improvement_goals_priority ON improvement_goals(priority);

-- ============================================
-- 5. TEAM PROGRESSION TABLE
-- ============================================
CREATE TABLE team_progression (
    id BIGSERIAL PRIMARY KEY,
    team_name TEXT NOT NULL,
    organization TEXT,
    level TEXT,

    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    duration_months INTEGER,
    age_at_start INTEGER,

    -- Achievements
    key_achievements TEXT,
    skills_learned TEXT[],
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_progression_dates ON team_progression(start_date DESC);

-- ============================================
-- HELPER FUNCTIONS (Calculate derived data)
-- ============================================

-- Function: Get current standard for a time
CREATE OR REPLACE FUNCTION get_current_standard(
    p_event_name TEXT,
    p_time_seconds DECIMAL,
    p_age_group TEXT DEFAULT '10'
)
RETURNS TEXT AS $$
DECLARE
    v_standards RECORD;
BEGIN
    SELECT * INTO v_standards
    FROM time_standards
    WHERE event_name = p_event_name AND age_group = p_age_group;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Check from fastest to slowest
    IF p_time_seconds <= v_standards.aaaa_time THEN RETURN 'AAAA';
    ELSIF p_time_seconds <= v_standards.aaa_time THEN RETURN 'AAA';
    ELSIF p_time_seconds <= v_standards.aa_time THEN RETURN 'AA';
    ELSIF p_time_seconds <= v_standards.a_time THEN RETURN 'A';
    ELSIF p_time_seconds <= v_standards.bb_time THEN RETURN 'BB';
    ELSIF p_time_seconds <= v_standards.b_time THEN RETURN 'B';
    ELSE RETURN 'Below B';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get next better standard info
CREATE OR REPLACE FUNCTION get_next_standard_info(
    p_event_name TEXT,
    p_time_seconds DECIMAL,
    p_age_group TEXT DEFAULT '10'
)
RETURNS TABLE(
    next_level TEXT,
    target_time DECIMAL,
    gap_seconds DECIMAL,
    improvement_pct DECIMAL
) AS $$
DECLARE
    v_standards RECORD;
    v_current_standard TEXT;
BEGIN
    SELECT * INTO v_standards
    FROM time_standards
    WHERE event_name = p_event_name AND age_group = p_age_group;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    v_current_standard := get_current_standard(p_event_name, p_time_seconds, p_age_group);

    -- Return next better standard based on current level
    -- If already at AAAA or faster, no next standard
    IF v_current_standard = 'AAAA' OR p_time_seconds <= v_standards.aaaa_time THEN
        RETURN; -- No next standard
    ELSIF v_current_standard = 'AAA' THEN
        RETURN QUERY SELECT 'AAAA'::TEXT, v_standards.aaaa_time,
               ROUND(p_time_seconds - v_standards.aaaa_time, 2),
               ROUND(((p_time_seconds - v_standards.aaaa_time) / p_time_seconds * 100)::DECIMAL, 2);
    ELSIF v_current_standard = 'AA' THEN
        RETURN QUERY SELECT 'AAA'::TEXT, v_standards.aaa_time,
               ROUND(p_time_seconds - v_standards.aaa_time, 2),
               ROUND(((p_time_seconds - v_standards.aaa_time) / p_time_seconds * 100)::DECIMAL, 2);
    ELSIF v_current_standard = 'A' THEN
        RETURN QUERY SELECT 'AA'::TEXT, v_standards.aa_time,
               ROUND(p_time_seconds - v_standards.aa_time, 2),
               ROUND(((p_time_seconds - v_standards.aa_time) / p_time_seconds * 100)::DECIMAL, 2);
    ELSIF v_current_standard = 'BB' THEN
        RETURN QUERY SELECT 'A'::TEXT, v_standards.a_time,
               ROUND(p_time_seconds - v_standards.a_time, 2),
               ROUND(((p_time_seconds - v_standards.a_time) / p_time_seconds * 100)::DECIMAL, 2);
    ELSIF v_current_standard = 'B' THEN
        RETURN QUERY SELECT 'BB'::TEXT, v_standards.bb_time,
               ROUND(p_time_seconds - v_standards.bb_time, 2),
               ROUND(((p_time_seconds - v_standards.bb_time) / p_time_seconds * 100)::DECIMAL, 2);
    ELSE -- Below B
        RETURN QUERY SELECT 'B'::TEXT, v_standards.b_time,
               ROUND(p_time_seconds - v_standards.b_time, 2),
               ROUND(((p_time_seconds - v_standards.b_time) / p_time_seconds * 100)::DECIMAL, 2);
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Format seconds to MM:SS.SS
CREATE OR REPLACE FUNCTION format_time(p_seconds DECIMAL)
RETURNS TEXT AS $$
DECLARE
    v_minutes INTEGER;
    v_seconds DECIMAL;
BEGIN
    IF p_seconds IS NULL THEN
        RETURN NULL;
    END IF;

    v_minutes := FLOOR(p_seconds / 60);
    v_seconds := p_seconds - (v_minutes * 60);

    IF v_minutes > 0 THEN
        RETURN v_minutes || ':' || LPAD(ROUND(v_seconds::NUMERIC, 2)::TEXT, 5, '0');
    ELSE
        RETURN ROUND(v_seconds::NUMERIC, 2)::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- VIEWS (Calculated on demand, no duplication)
-- ============================================

-- View: Personal Bests (derived from data)
CREATE OR REPLACE VIEW personal_bests AS
SELECT DISTINCT ON (event_name)
    event_name,
    time_seconds as best_time_seconds,
    format_time(time_seconds) as best_time_formatted,
    event_date as achieved_date
FROM competition_results
ORDER BY event_name, time_seconds ASC, event_date DESC;

-- View: Latest Times Per Event (no calculated fields)
CREATE OR REPLACE VIEW latest_times_per_event AS
SELECT DISTINCT ON (event_name)
    id,
    event_name,
    event_date,
    time_formatted,
    time_seconds,
    meet_name,
    team,
    course_type
FROM competition_results
ORDER BY event_name, event_date DESC, id DESC;

-- View: Competition Results with Standards (all calculations here)
CREATE OR REPLACE VIEW competition_results_with_standards AS
SELECT
    cr.id,
    cr.event_name,
    cr.event_date,
    cr.time_formatted,
    cr.time_seconds,
    cr.meet_name,
    cr.team,
    cr.course_type,
    cr.distance,
    cr.stroke,
    cr.points,
    cr.age,

    -- Calculated fields
    get_current_standard(cr.event_name, cr.time_seconds) as current_standard,
    (SELECT next_level FROM get_next_standard_info(cr.event_name, cr.time_seconds)) as next_standard,
    (SELECT target_time FROM get_next_standard_info(cr.event_name, cr.time_seconds)) as next_target_seconds,
    format_time((SELECT target_time FROM get_next_standard_info(cr.event_name, cr.time_seconds))) as next_target_formatted,
    (SELECT gap_seconds FROM get_next_standard_info(cr.event_name, cr.time_seconds)) as gap_seconds,
    (SELECT improvement_pct FROM get_next_standard_info(cr.event_name, cr.time_seconds)) as improvement_needed_pct,

    -- Is this a personal best?
    cr.time_seconds = (SELECT best_time_seconds FROM personal_bests pb WHERE pb.event_name = cr.event_name) as is_personal_best
FROM competition_results cr;

-- View: Progress Report (clean, no duplicate columns)
CREATE OR REPLACE VIEW progress_report AS
SELECT
    lt.event_name,
    lt.event_date as latest_swim_date,
    lt.time_formatted as current_time,
    lt.time_seconds,

    -- Current performance
    get_current_standard(lt.event_name, lt.time_seconds) as current_standard,

    -- Next goal
    (SELECT next_level FROM get_next_standard_info(lt.event_name, lt.time_seconds)) as next_standard,
    format_time((SELECT target_time FROM get_next_standard_info(lt.event_name, lt.time_seconds))) as next_target_time,
    (SELECT gap_seconds FROM get_next_standard_info(lt.event_name, lt.time_seconds)) as gap_seconds,
    (SELECT improvement_pct FROM get_next_standard_info(lt.event_name, lt.time_seconds)) as improvement_pct,

    -- Personal best comparison
    pb.best_time_formatted as personal_best,
    pb.achieved_date as pb_date,
    ROUND(lt.time_seconds - pb.best_time_seconds, 2) as seconds_off_pb

FROM latest_times_per_event lt
LEFT JOIN personal_bests pb ON lt.event_name = pb.event_name
ORDER BY lt.event_name;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competition_results_updated_at
    BEFORE UPDATE ON competition_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_practice_sessions_updated_at
    BEFORE UPDATE ON practice_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_improvement_goals_updated_at
    BEFORE UPDATE ON improvement_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_progression_updated_at
    BEFORE UPDATE ON team_progression
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE competition_results IS 'Swim meet performances - stores facts only, calculations in views';
COMMENT ON TABLE time_standards IS 'USA Swimming motivational time standards by age';
COMMENT ON TABLE practice_sessions IS 'Daily practice sessions with focus areas and feedback';
COMMENT ON TABLE improvement_goals IS 'Target times and goals with progress tracking';
COMMENT ON TABLE team_progression IS 'Historical record of team changes and progression';

COMMENT ON VIEW personal_bests IS 'Derived view: Best time ever for each event';
COMMENT ON VIEW latest_times_per_event IS 'Derived view: Most recent swim for each event';
COMMENT ON VIEW competition_results_with_standards IS 'Derived view: All results with calculated standards and gaps';
COMMENT ON VIEW progress_report IS 'Derived view: Clean progress report with no duplicate columns';
