-- COMPLETE FIX: Time Standards Calculation System (v2)
-- This script fixes all issues with time standard calculations
-- Fixed order: Drop views BEFORE dropping functions

-- Step 1: Add gender column to swimmers table if it doesn't exist
ALTER TABLE swimmers ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Boys';

-- Update Vihaan's gender (assuming Boys)
UPDATE swimmers SET gender = 'Boys' WHERE id = 1;

-- Step 2: Drop and recreate helper function for age group
DROP FUNCTION IF EXISTS get_age_group_from_age(INTEGER);
CREATE OR REPLACE FUNCTION get_age_group_from_age(p_age INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF p_age <= 10 THEN RETURN '10 & under';
    ELSIF p_age >= 11 AND p_age <= 12 THEN RETURN '11-12';
    ELSIF p_age >= 13 AND p_age <= 14 THEN RETURN '13-14';
    ELSIF p_age >= 15 AND p_age <= 16 THEN RETURN '15-16';
    ELSIF p_age >= 17 AND p_age <= 18 THEN RETURN '17-18';
    ELSE RETURN 'Open';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Drop views FIRST (they depend on functions)
DROP VIEW IF EXISTS competition_results_with_standards CASCADE;
DROP VIEW IF EXISTS progress_report CASCADE;

-- Step 4: Now drop existing functions
DROP FUNCTION IF EXISTS get_current_standard(TEXT, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS get_current_standard(TEXT, DECIMAL, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_next_standard_info(TEXT, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS get_next_standard_info(TEXT, DECIMAL, INTEGER, TEXT, TEXT);

-- Step 5: Create corrected get_current_standard function
CREATE OR REPLACE FUNCTION get_current_standard(
    p_event_name TEXT,
    p_time_seconds DECIMAL,
    p_age INTEGER,
    p_gender TEXT DEFAULT 'Boys',
    p_course_type TEXT DEFAULT 'SCY'
)
RETURNS TEXT AS $$
DECLARE
    v_standards RECORD;
    v_age_group TEXT;
BEGIN
    v_age_group := get_age_group_from_age(p_age);

    SELECT * INTO v_standards
    FROM time_standards
    WHERE event_name = p_event_name
      AND age_group = v_age_group
      AND gender = p_gender
      AND course_type = p_course_type
    LIMIT 1;

    IF NOT FOUND THEN RETURN NULL; END IF;

    -- Lower is faster for Girls and most events
    IF p_time_seconds <= v_standards.aaaa_standard THEN RETURN 'AAAA';
    ELSIF p_time_seconds <= v_standards.aaa_standard THEN RETURN 'AAA';
    ELSIF p_time_seconds <= v_standards.aa_standard THEN RETURN 'AA';
    ELSIF p_time_seconds <= v_standards.a_standard THEN RETURN 'A';
    ELSIF p_time_seconds <= v_standards.bb_standard THEN RETURN 'BB';
    ELSIF p_time_seconds <= v_standards.b_standard THEN RETURN 'B';
    ELSE RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 6: Create corrected get_next_standard_info function
CREATE OR REPLACE FUNCTION get_next_standard_info(
    p_event_name TEXT,
    p_time_seconds DECIMAL,
    p_age INTEGER,
    p_gender TEXT DEFAULT 'Boys',
    p_course_type TEXT DEFAULT 'SCY'
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
    v_age_group TEXT;
BEGIN
    v_age_group := get_age_group_from_age(p_age);

    SELECT * INTO v_standards
    FROM time_standards
    WHERE event_name = p_event_name
      AND age_group = v_age_group
      AND gender = p_gender
      AND course_type = p_course_type
    LIMIT 1;

    IF NOT FOUND THEN RETURN; END IF;

    v_current_standard := get_current_standard(p_event_name, p_time_seconds, p_age, p_gender, p_course_type);

    IF v_current_standard IS NULL THEN
        -- Slower than B
        RETURN QUERY SELECT 'B'::TEXT, v_standards.b_standard,
               ROUND(p_time_seconds - v_standards.b_standard, 2),
               ROUND(((p_time_seconds - v_standards.b_standard) / p_time_seconds * 100)::DECIMAL, 2);
    ELSIF v_current_standard = 'AAAA' THEN
        RETURN; -- Already at highest
    ELSIF v_current_standard = 'AAA' THEN
        RETURN QUERY SELECT 'AAAA'::TEXT, v_standards.aaaa_standard,
               ROUND(p_time_seconds - v_standards.aaaa_standard, 2),
               ROUND(((p_time_seconds - v_standards.aaaa_standard) / p_time_seconds * 100)::DECIMAL, 2);
    ELSIF v_current_standard = 'AA' THEN
        RETURN QUERY SELECT 'AAA'::TEXT, v_standards.aaa_standard,
               ROUND(p_time_seconds - v_standards.aaa_standard, 2),
               ROUND(((p_time_seconds - v_standards.aaa_standard) / p_time_seconds * 100)::DECIMAL, 2);
    ELSIF v_current_standard = 'A' THEN
        RETURN QUERY SELECT 'AA'::TEXT, v_standards.aa_standard,
               ROUND(p_time_seconds - v_standards.aa_standard, 2),
               ROUND(((p_time_seconds - v_standards.aa_standard) / p_time_seconds * 100)::DECIMAL, 2);
    ELSIF v_current_standard = 'BB' THEN
        RETURN QUERY SELECT 'A'::TEXT, v_standards.a_standard,
               ROUND(p_time_seconds - v_standards.a_standard, 2),
               ROUND(((p_time_seconds - v_standards.a_standard) / p_time_seconds * 100)::DECIMAL, 2);
    ELSIF v_current_standard = 'B' THEN
        RETURN QUERY SELECT 'BB'::TEXT, v_standards.bb_standard,
               ROUND(p_time_seconds - v_standards.bb_standard, 2),
               ROUND(((p_time_seconds - v_standards.bb_standard) / p_time_seconds * 100)::DECIMAL, 2);
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 7: Recreate competition_results_with_standards view with corrected function calls
CREATE OR REPLACE VIEW competition_results_with_standards AS
SELECT
    cr.id,
    cr.swimmer_id,
    s.full_name as swimmer_name,
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
    cr.lsc,
    cr.time_standard as awarded_standard,

    -- Calculated fields with corrected function calls
    get_current_standard(cr.event_name, cr.time_seconds, cr.age, COALESCE(s.gender, 'Boys'), cr.course_type) as calculated_standard,
    (SELECT next_level FROM get_next_standard_info(cr.event_name, cr.time_seconds, cr.age, COALESCE(s.gender, 'Boys'), cr.course_type)) as next_standard,
    (SELECT target_time FROM get_next_standard_info(cr.event_name, cr.time_seconds, cr.age, COALESCE(s.gender, 'Boys'), cr.course_type)) as next_target_seconds,
    format_time((SELECT target_time FROM get_next_standard_info(cr.event_name, cr.time_seconds, cr.age, COALESCE(s.gender, 'Boys'), cr.course_type))) as next_target_formatted,
    (SELECT gap_seconds FROM get_next_standard_info(cr.event_name, cr.time_seconds, cr.age, COALESCE(s.gender, 'Boys'), cr.course_type)) as gap_seconds,
    (SELECT improvement_pct FROM get_next_standard_info(cr.event_name, cr.time_seconds, cr.age, COALESCE(s.gender, 'Boys'), cr.course_type)) as improvement_needed_pct,

    -- Is this a personal best?
    cr.time_seconds = (SELECT best_time_seconds FROM personal_bests pb WHERE pb.swimmer_id = cr.swimmer_id AND pb.event_name = cr.event_name) as is_personal_best
FROM competition_results cr
JOIN swimmers s ON cr.swimmer_id = s.id;

-- Step 8: Recreate progress_report view
CREATE OR REPLACE VIEW progress_report AS
SELECT
    lt.swimmer_id,
    s.full_name as swimmer_name,
    lt.event_name,
    lt.event_date as latest_swim_date,
    lt.time_formatted as current_time,
    lt.time_seconds,

    -- Current performance
    get_current_standard(lt.event_name, lt.time_seconds, COALESCE(s.current_age, 10), COALESCE(s.gender, 'Boys'), 'SCY') as current_standard,

    -- Next goal
    (SELECT next_level FROM get_next_standard_info(lt.event_name, lt.time_seconds, COALESCE(s.current_age, 10), COALESCE(s.gender, 'Boys'), 'SCY')) as next_standard,
    format_time((SELECT target_time FROM get_next_standard_info(lt.event_name, lt.time_seconds, COALESCE(s.current_age, 10), COALESCE(s.gender, 'Boys'), 'SCY'))) as next_target_time,
    (SELECT gap_seconds FROM get_next_standard_info(lt.event_name, lt.time_seconds, COALESCE(s.current_age, 10), COALESCE(s.gender, 'Boys'), 'SCY')) as gap_seconds,
    (SELECT improvement_pct FROM get_next_standard_info(lt.event_name, lt.time_seconds, COALESCE(s.current_age, 10), COALESCE(s.gender, 'Boys'), 'SCY')) as improvement_pct,

    -- Personal best comparison
    pb.best_time_seconds as personal_best,
    pb.achieved_date as pb_date,
    ROUND(lt.time_seconds - pb.best_time_seconds, 2) as seconds_off_pb
FROM latest_times_per_event lt
JOIN swimmers s ON lt.swimmer_id = s.id
LEFT JOIN personal_bests pb ON pb.swimmer_id = lt.swimmer_id AND pb.event_name = lt.event_name;

-- Step 9: Test the fixes
SELECT
    'Test: 50 FL SCY, 41.63s, age 10' as test_case,
    get_current_standard('50 FL', 41.63, 10, 'Boys', 'SCY') as calculated_standard,
    *
FROM get_next_standard_info('50 FL', 41.63, 10, 'Boys', 'SCY');

-- Expected: calculated_standard = 'B', next_standard = 'BB', target = 41.29, gap = 0.34

SELECT
    event_name,
    time_seconds,
    calculated_standard,
    next_standard,
    next_target_seconds,
    gap_seconds
FROM competition_results_with_standards
WHERE event_name = '50 FL SCY' AND swimmer_id = 1
ORDER BY event_date DESC
LIMIT 3;
