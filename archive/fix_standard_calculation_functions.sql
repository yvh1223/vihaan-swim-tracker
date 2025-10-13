-- Fix the time standard calculation functions to:
-- 1. Use correct column names (_standard instead of _time)
-- 2. Match on gender, course_type, and proper age_group
-- 3. Handle both single age and age range formats

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_current_standard(TEXT, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS get_next_standard_info(TEXT, DECIMAL, TEXT);

-- Helper function to determine age group from age
CREATE OR REPLACE FUNCTION get_age_group_from_age(p_age INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF p_age <= 10 THEN
        RETURN '10 & under';
    ELSIF p_age >= 11 AND p_age <= 12 THEN
        RETURN '11-12';
    ELSIF p_age >= 13 AND p_age <= 14 THEN
        RETURN '13-14';
    ELSIF p_age >= 15 AND p_age <= 16 THEN
        RETURN '15-16';
    ELSIF p_age >= 17 AND p_age <= 18 THEN
        RETURN '17-18';
    ELSE
        RETURN 'Open';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get current standard for a time
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
    -- Convert age to age group
    v_age_group := get_age_group_from_age(p_age);

    -- Query time_standards with proper matching
    SELECT * INTO v_standards
    FROM time_standards
    WHERE event_name = p_event_name
      AND age_group = v_age_group
      AND gender = p_gender
      AND course_type = p_course_type
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Check from fastest to slowest
    -- Note: For Girls, faster times are lower. For Boys in some events, it's reversed in the standards.
    -- We check if lower times are better by comparing AAAA vs B standards
    IF v_standards.aaaa_standard < v_standards.b_standard THEN
        -- Lower is faster (normal case)
        IF p_time_seconds <= v_standards.aaaa_standard THEN RETURN 'AAAA';
        ELSIF p_time_seconds <= v_standards.aaa_standard THEN RETURN 'AAA';
        ELSIF p_time_seconds <= v_standards.aa_standard THEN RETURN 'AA';
        ELSIF p_time_seconds <= v_standards.a_standard THEN RETURN 'A';
        ELSIF p_time_seconds <= v_standards.bb_standard THEN RETURN 'BB';
        ELSIF p_time_seconds <= v_standards.b_standard THEN RETURN 'B';
        ELSE RETURN NULL; -- Slower than B
        END IF;
    ELSE
        -- Higher is faster (reversed case for some Boys events)
        IF p_time_seconds >= v_standards.aaaa_standard THEN RETURN 'AAAA';
        ELSIF p_time_seconds >= v_standards.aaa_standard THEN RETURN 'AAA';
        ELSIF p_time_seconds >= v_standards.aa_standard THEN RETURN 'AA';
        ELSIF p_time_seconds >= v_standards.a_standard THEN RETURN 'A';
        ELSIF p_time_seconds >= v_standards.bb_standard THEN RETURN 'BB';
        ELSIF p_time_seconds >= v_standards.b_standard THEN RETURN 'B';
        ELSE RETURN NULL; -- Slower than B
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get next better standard info
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
    v_is_lower_faster BOOLEAN;
BEGIN
    -- Convert age to age group
    v_age_group := get_age_group_from_age(p_age);

    -- Query time_standards with proper matching
    SELECT * INTO v_standards
    FROM time_standards
    WHERE event_name = p_event_name
      AND age_group = v_age_group
      AND gender = p_gender
      AND course_type = p_course_type
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Determine if lower times are faster
    v_is_lower_faster := (v_standards.aaaa_standard < v_standards.b_standard);

    v_current_standard := get_current_standard(p_event_name, p_time_seconds, p_age, p_gender, p_course_type);

    IF v_current_standard IS NULL THEN
        -- Slower than B, next target is B
        IF v_is_lower_faster THEN
            RETURN QUERY SELECT 'B'::TEXT, v_standards.b_standard,
                   ROUND(p_time_seconds - v_standards.b_standard, 2),
                   ROUND(((p_time_seconds - v_standards.b_standard) / p_time_seconds * 100)::DECIMAL, 2);
        ELSE
            RETURN QUERY SELECT 'B'::TEXT, v_standards.b_standard,
                   ROUND(v_standards.b_standard - p_time_seconds, 2),
                   ROUND(((v_standards.b_standard - p_time_seconds) / v_standards.b_standard * 100)::DECIMAL, 2);
        END IF;
    ELSIF v_current_standard = 'AAAA' THEN
        RETURN; -- No next standard
    ELSIF v_current_standard = 'AAA' THEN
        IF v_is_lower_faster THEN
            RETURN QUERY SELECT 'AAAA'::TEXT, v_standards.aaaa_standard,
                   ROUND(p_time_seconds - v_standards.aaaa_standard, 2),
                   ROUND(((p_time_seconds - v_standards.aaaa_standard) / p_time_seconds * 100)::DECIMAL, 2);
        ELSE
            RETURN QUERY SELECT 'AAAA'::TEXT, v_standards.aaaa_standard,
                   ROUND(v_standards.aaaa_standard - p_time_seconds, 2),
                   ROUND(((v_standards.aaaa_standard - p_time_seconds) / v_standards.aaaa_standard * 100)::DECIMAL, 2);
        END IF;
    ELSIF v_current_standard = 'AA' THEN
        IF v_is_lower_faster THEN
            RETURN QUERY SELECT 'AAA'::TEXT, v_standards.aaa_standard,
                   ROUND(p_time_seconds - v_standards.aaa_standard, 2),
                   ROUND(((p_time_seconds - v_standards.aaa_standard) / p_time_seconds * 100)::DECIMAL, 2);
        ELSE
            RETURN QUERY SELECT 'AAA'::TEXT, v_standards.aaa_standard,
                   ROUND(v_standards.aaa_standard - p_time_seconds, 2),
                   ROUND(((v_standards.aaa_standard - p_time_seconds) / v_standards.aaa_standard * 100)::DECIMAL, 2);
        END IF;
    ELSIF v_current_standard = 'A' THEN
        IF v_is_lower_faster THEN
            RETURN QUERY SELECT 'AA'::TEXT, v_standards.aa_standard,
                   ROUND(p_time_seconds - v_standards.aa_standard, 2),
                   ROUND(((p_time_seconds - v_standards.aa_standard) / p_time_seconds * 100)::DECIMAL, 2);
        ELSE
            RETURN QUERY SELECT 'AA'::TEXT, v_standards.aa_standard,
                   ROUND(v_standards.aa_standard - p_time_seconds, 2),
                   ROUND(((v_standards.aa_standard - p_time_seconds) / v_standards.aa_standard * 100)::DECIMAL, 2);
        END IF;
    ELSIF v_current_standard = 'BB' THEN
        IF v_is_lower_faster THEN
            RETURN QUERY SELECT 'A'::TEXT, v_standards.a_standard,
                   ROUND(p_time_seconds - v_standards.a_standard, 2),
                   ROUND(((p_time_seconds - v_standards.a_standard) / p_time_seconds * 100)::DECIMAL, 2);
        ELSE
            RETURN QUERY SELECT 'A'::TEXT, v_standards.a_standard,
                   ROUND(v_standards.a_standard - p_time_seconds, 2),
                   ROUND(((v_standards.a_standard - p_time_seconds) / v_standards.a_standard * 100)::DECIMAL, 2);
        END IF;
    ELSIF v_current_standard = 'B' THEN
        IF v_is_lower_faster THEN
            RETURN QUERY SELECT 'BB'::TEXT, v_standards.bb_standard,
                   ROUND(p_time_seconds - v_standards.bb_standard, 2),
                   ROUND(((p_time_seconds - v_standards.bb_standard) / p_time_seconds * 100)::DECIMAL, 2);
        ELSE
            RETURN QUERY SELECT 'BB'::TEXT, v_standards.bb_standard,
                   ROUND(v_standards.bb_standard - p_time_seconds, 2),
                   ROUND(((v_standards.bb_standard - p_time_seconds) / v_standards.bb_standard * 100)::DECIMAL, 2);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Test the functions
SELECT
    '50 FL' as event,
    41.63 as time_seconds,
    get_current_standard('50 FL', 41.63, 10, 'Boys', 'SCY') as calculated_standard,
    *
FROM get_next_standard_info('50 FL', 41.63, 10, 'Boys', 'SCY');

-- Expected: calculated_standard = 'B', next_standard = 'BB', target = 41.29, gap = 0.34
