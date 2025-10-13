-- RECALCULATE ALL TIME STANDARDS IN DATABASE
-- This script updates all time_standard values in competition_results table
-- by calling the get_current_standard RPC function for each record

-- Step 1: Update all time_standard values using the calculated standard
UPDATE competition_results cr
SET time_standard = (
    SELECT get_current_standard(
        -- Remove course type from event name (e.g., "50 FL SCY" -> "50 FL")
        REGEXP_REPLACE(cr.event_name, ' (SCY|LCM|SCM)$', ''),
        cr.time_seconds,
        cr.age,
        COALESCE(s.gender, 'Boys'),
        cr.course_type
    )
    FROM swimmers s
    WHERE s.id = cr.swimmer_id
)
WHERE cr.swimmer_id = 1;  -- Only update for Vihaan (swimmer_id = 1)

-- Step 2: Verify the update
SELECT
    event_name,
    time_seconds,
    time_standard,
    age,
    event_date
FROM competition_results
WHERE swimmer_id = 1
ORDER BY event_date DESC
LIMIT 20;

-- Step 3: Count by time_standard to verify no incorrect 'A' times
SELECT
    time_standard,
    COUNT(*) as count
FROM competition_results
WHERE swimmer_id = 1
GROUP BY time_standard
ORDER BY time_standard;
