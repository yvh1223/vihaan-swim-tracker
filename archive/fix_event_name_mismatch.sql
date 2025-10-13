-- Fix event name mismatch in database views
-- Problem: competition_results has "100 BK SCY" but time_standards expects "100 BK"
-- Solution: Strip course type suffix before calling RPC functions

-- Drop existing views
DROP VIEW IF EXISTS progress_report CASCADE;
DROP VIEW IF EXISTS competition_results_with_standards CASCADE;

-- Recreate competition_results_with_standards view with fixed event names
CREATE OR REPLACE VIEW competition_results_with_standards AS
SELECT
    cr.id,
    cr.swimmer_id,
    cr.event_name,
    cr.event_date,
    cr.time_seconds,
    cr.age,
    cr.course_type,
    cr.meet_name,
    cr.points,
    cr.time_standard as stored_time_standard,
    s.full_name,
    s.gender,
    s.current_age,
    -- Strip course type suffix before calling RPC function
    get_current_standard(
        REGEXP_REPLACE(cr.event_name, ' (SCY|LCM|SCM)$', ''),
        cr.time_seconds,
        cr.age,
        COALESCE(s.gender, 'Boys'),
        cr.course_type
    ) as calculated_time_standard
FROM competition_results cr
LEFT JOIN swimmers s ON cr.swimmer_id = s.id
ORDER BY cr.event_date DESC, cr.event_name;

-- Recreate progress_report view with fixed event names
CREATE OR REPLACE VIEW progress_report AS
SELECT
    lt.swimmer_id,
    s.full_name as swimmer_name,
    lt.event_name,
    lt.event_date as latest_swim_date,
    lt.time_formatted as current_time,
    lt.time_seconds,
    -- Strip course type suffix before calling RPC functions
    get_current_standard(
        REGEXP_REPLACE(lt.event_name, ' (SCY|LCM|SCM)$', ''),
        lt.time_seconds,
        COALESCE(s.current_age, 10),
        COALESCE(s.gender, 'Boys'),
        lt.course_type
    ) as current_standard,
    (SELECT next_level FROM get_next_standard_info(
        REGEXP_REPLACE(lt.event_name, ' (SCY|LCM|SCM)$', ''),
        lt.time_seconds,
        COALESCE(s.current_age, 10),
        COALESCE(s.gender, 'Boys'),
        lt.course_type
    )) as next_standard,
    format_time((SELECT target_time FROM get_next_standard_info(
        REGEXP_REPLACE(lt.event_name, ' (SCY|LCM|SCM)$', ''),
        lt.time_seconds,
        COALESCE(s.current_age, 10),
        COALESCE(s.gender, 'Boys'),
        lt.course_type
    ))) as next_target_time,
    (SELECT gap_seconds FROM get_next_standard_info(
        REGEXP_REPLACE(lt.event_name, ' (SCY|LCM|SCM)$', ''),
        lt.time_seconds,
        COALESCE(s.current_age, 10),
        COALESCE(s.gender, 'Boys'),
        lt.course_type
    )) as gap_seconds,
    (SELECT improvement_pct FROM get_next_standard_info(
        REGEXP_REPLACE(lt.event_name, ' (SCY|LCM|SCM)$', ''),
        lt.time_seconds,
        COALESCE(s.current_age, 10),
        COALESCE(s.gender, 'Boys'),
        lt.course_type
    )) as improvement_pct
FROM latest_times_per_event lt
JOIN swimmers s ON lt.swimmer_id = s.id
ORDER BY lt.event_name;

-- Grant permissions
GRANT SELECT ON competition_results_with_standards TO anon, authenticated;
GRANT SELECT ON progress_report TO anon, authenticated;
