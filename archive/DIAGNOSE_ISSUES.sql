-- ========================================
-- DIAGNOSTIC SCRIPT - Gap Analysis Issues
-- ========================================
-- This script diagnoses why gap analysis charts show incorrect data
-- Run this BEFORE executing FIX_ALL_ISSUES.sql
-- ========================================

-- ========================================
-- CHECK 1: Swimmer Records (Duplicates?)
-- ========================================
SELECT
    '👤 SWIMMER RECORDS' as check_type,
    id,
    first_name,
    last_name,
    full_name,
    created_at
FROM swimmers
WHERE full_name LIKE '%Vihaan%' OR full_name LIKE '%Vihang%'
   OR first_name LIKE '%Vihaan%' OR first_name LIKE '%Vihang%'
ORDER BY created_at;

-- Expected: Should show if there are 1 or 2+ swimmer records
-- If 2+, this is causing the gap analysis to use mixed data

-- ========================================
-- CHECK 2: Competition Results by Swimmer
-- ========================================
SELECT
    '📊 RESULTS PER SWIMMER' as check_type,
    s.id as swimmer_id,
    s.full_name,
    COUNT(cr.id) as total_results,
    MIN(cr.event_date) as earliest_event,
    MAX(cr.event_date) as latest_event,
    COUNT(CASE WHEN cr.time_standard = 'A' THEN 1 END) as a_count,
    COUNT(CASE WHEN cr.time_standard = 'BB' THEN 1 END) as bb_count,
    COUNT(CASE WHEN cr.time_standard = 'B' THEN 1 END) as b_count,
    COUNT(CASE WHEN cr.time_standard IS NULL THEN 1 END) as null_count
FROM swimmers s
LEFT JOIN competition_results cr ON s.id = cr.swimmer_id
WHERE s.full_name LIKE '%Vihaan%' OR s.full_name LIKE '%Vihang%'
GROUP BY s.id, s.full_name
ORDER BY s.created_at;

-- This shows how results are distributed across duplicate swimmers
-- Gap charts may be calculating from wrong swimmer record

-- ========================================
-- CHECK 3: Personal Records Calculation
-- ========================================
-- Simulate what the gap analysis chart does
WITH personal_records AS (
    SELECT
        s.id as swimmer_id,
        s.full_name,
        cr.event_name,
        MIN(cr.time_seconds) as best_time,
        MAX(cr.event_date) FILTER (WHERE cr.time_seconds = MIN(cr.time_seconds)) as pr_date
    FROM swimmers s
    JOIN competition_results cr ON s.id = cr.swimmer_id
    WHERE s.full_name LIKE '%Vihaan%' OR s.full_name LIKE '%Vihang%'
    GROUP BY s.id, s.full_name, cr.event_name
)
SELECT
    '🏆 PERSONAL RECORDS BY SWIMMER' as check_type,
    swimmer_id,
    full_name,
    event_name,
    CASE
        WHEN best_time >= 60 THEN
            FLOOR(best_time / 60)::TEXT || ':' || LPAD((best_time % 60)::NUMERIC(5,2)::TEXT, 5, '0')
        ELSE
            best_time::NUMERIC(5,2)::TEXT
    END as best_time_formatted,
    pr_date
FROM personal_records
ORDER BY swimmer_id, event_name;

-- This shows PRs separately for each swimmer ID
-- If duplicates exist, charts may be pulling from wrong swimmer

-- ========================================
-- CHECK 4: October Meet Data Issues
-- ========================================
SELECT
    '📅 OCTOBER MEET DATA' as check_type,
    event_name,
    event_date,
    time_formatted,
    time_seconds,
    time_standard,
    swimmer_id,
    notes
FROM competition_results
WHERE meet_name = '14 & Under Division A B/C meet'
ORDER BY event_date, event_name;

-- Expected: 6 events with NULL or incorrect time_standard values
-- This is why October meet data doesn't appear in charts

-- ========================================
-- CHECK 5: Gap to BB Standard Calculation
-- ========================================
-- This simulates the gap analysis chart's calculation logic
WITH latest_times AS (
    SELECT
        event_name,
        MIN(time_seconds) as best_time,
        MAX(event_date) FILTER (WHERE time_seconds = MIN(time_seconds)) as pr_date
    FROM competition_results
    WHERE swimmer_id IN (
        SELECT id FROM swimmers
        WHERE full_name LIKE '%Vihaan%' OR full_name LIKE '%Vihang%'
    )
    GROUP BY event_name
)
SELECT
    '📐 BB GAP CALCULATIONS' as check_type,
    lt.event_name,
    CASE
        WHEN lt.best_time >= 60 THEN
            FLOOR(lt.best_time / 60)::TEXT || ':' || LPAD((lt.best_time % 60)::NUMERIC(5,2)::TEXT, 5, '0')
        ELSE
            lt.best_time::NUMERIC(5,2)::TEXT
    END as current_best,
    lt.best_time as current_seconds,
    -- BB Standard for 10&U age group
    CASE lt.event_name
        WHEN '50 FR SCY' THEN 38.09
        WHEN '100 FR SCY' THEN 86.99
        WHEN '200 FR SCY' THEN 185.69
        WHEN '50 BK SCY' THEN 46.79
        WHEN '100 BK SCY' THEN 99.09
        WHEN '50 BR SCY' THEN 51.39
        WHEN '100 BR SCY' THEN 112.59
        WHEN '50 FL SCY' THEN 44.79
        WHEN '100 FL SCY' THEN 108.29
        WHEN '100 IM SCY' THEN 98.79
        WHEN '200 IM SCY' THEN 213.49
        ELSE NULL
    END as bb_standard,
    -- Calculate gap
    CASE
        WHEN lt.event_name = '50 FR SCY' THEN lt.best_time - 38.09
        WHEN lt.event_name = '100 FR SCY' THEN lt.best_time - 86.99
        WHEN lt.event_name = '200 FR SCY' THEN lt.best_time - 185.69
        WHEN lt.event_name = '50 BK SCY' THEN lt.best_time - 46.79
        WHEN lt.event_name = '100 BK SCY' THEN lt.best_time - 99.09
        WHEN lt.event_name = '50 BR SCY' THEN lt.best_time - 51.39
        WHEN lt.event_name = '100 BR SCY' THEN lt.best_time - 112.59
        WHEN lt.event_name = '50 FL SCY' THEN lt.best_time - 44.79
        WHEN lt.event_name = '100 FL SCY' THEN lt.best_time - 108.29
        WHEN lt.event_name = '100 IM SCY' THEN lt.best_time - 98.79
        WHEN lt.event_name = '200 IM SCY' THEN lt.best_time - 213.49
        ELSE NULL
    END as gap_to_bb,
    CASE
        WHEN (CASE
            WHEN lt.event_name = '50 FR SCY' THEN lt.best_time - 38.09
            WHEN lt.event_name = '100 FR SCY' THEN lt.best_time - 86.99
            WHEN lt.event_name = '200 FR SCY' THEN lt.best_time - 185.69
            WHEN lt.event_name = '50 BK SCY' THEN lt.best_time - 46.79
            WHEN lt.event_name = '100 BK SCY' THEN lt.best_time - 99.09
            WHEN lt.event_name = '50 BR SCY' THEN lt.best_time - 51.39
            WHEN lt.event_name = '100 BR SCY' THEN lt.best_time - 112.59
            WHEN lt.event_name = '50 FL SCY' THEN lt.best_time - 44.79
            WHEN lt.event_name = '100 FL SCY' THEN lt.best_time - 108.29
            WHEN lt.event_name = '100 IM SCY' THEN lt.best_time - 98.79
            WHEN lt.event_name = '200 IM SCY' THEN lt.best_time - 213.49
        END) < 0 THEN '✅ ALREADY FASTER'
        ELSE '⚠️ NEEDS IMPROVEMENT'
    END as status
FROM latest_times lt
WHERE lt.event_name LIKE '% SCY'
ORDER BY gap_to_bb DESC NULLS LAST;

-- This shows what the gap SHOULD be for each event
-- Compare with what the chart is showing

-- ========================================
-- CHECK 6: Gap to A Standard Calculation
-- ========================================
WITH latest_times AS (
    SELECT
        event_name,
        MIN(time_seconds) as best_time
    FROM competition_results
    WHERE swimmer_id IN (
        SELECT id FROM swimmers
        WHERE full_name LIKE '%Vihaan%' OR full_name LIKE '%Vihang%'
    )
    GROUP BY event_name
)
SELECT
    '🏆 A GAP CALCULATIONS' as check_type,
    lt.event_name,
    CASE
        WHEN lt.best_time >= 60 THEN
            FLOOR(lt.best_time / 60)::TEXT || ':' || LPAD((lt.best_time % 60)::NUMERIC(5,2)::TEXT, 5, '0')
        ELSE
            lt.best_time::NUMERIC(5,2)::TEXT
    END as current_best,
    -- A Standard for 10&U age group
    CASE lt.event_name
        WHEN '50 FR SCY' THEN 34.19
        WHEN '100 FR SCY' THEN 76.99
        WHEN '200 FR SCY' THEN 164.99
        WHEN '50 BK SCY' THEN 40.99
        WHEN '100 BK SCY' THEN 87.49
        WHEN '50 BR SCY' THEN 45.29
        WHEN '100 BR SCY' THEN 99.59
        WHEN '50 FL SCY' THEN 39.09
        WHEN '100 FL SCY' THEN 92.29
        WHEN '100 IM SCY' THEN 87.89
        WHEN '200 IM SCY' THEN 188.89
        ELSE NULL
    END as a_standard,
    -- Calculate gap
    CASE
        WHEN lt.event_name = '50 FR SCY' THEN lt.best_time - 34.19
        WHEN lt.event_name = '100 FR SCY' THEN lt.best_time - 76.99
        WHEN lt.event_name = '200 FR SCY' THEN lt.best_time - 164.99
        WHEN lt.event_name = '50 BK SCY' THEN lt.best_time - 40.99
        WHEN lt.event_name = '100 BK SCY' THEN lt.best_time - 87.49
        WHEN lt.event_name = '50 BR SCY' THEN lt.best_time - 45.29
        WHEN lt.event_name = '100 BR SCY' THEN lt.best_time - 99.59
        WHEN lt.event_name = '50 FL SCY' THEN lt.best_time - 39.09
        WHEN lt.event_name = '100 FL SCY' THEN lt.best_time - 92.29
        WHEN lt.event_name = '100 IM SCY' THEN lt.best_time - 87.89
        WHEN lt.event_name = '200 IM SCY' THEN lt.best_time - 188.89
        ELSE NULL
    END as gap_to_a,
    CASE
        WHEN (CASE
            WHEN lt.event_name = '50 FR SCY' THEN lt.best_time - 34.19
            WHEN lt.event_name = '100 FR SCY' THEN lt.best_time - 76.99
            WHEN lt.event_name = '200 FR SCY' THEN lt.best_time - 164.99
            WHEN lt.event_name = '50 BK SCY' THEN lt.best_time - 40.99
            WHEN lt.event_name = '100 BK SCY' THEN lt.best_time - 87.49
            WHEN lt.event_name = '50 BR SCY' THEN lt.best_time - 45.29
            WHEN lt.event_name = '100 BR SCY' THEN lt.best_time - 99.59
            WHEN lt.event_name = '50 FL SCY' THEN lt.best_time - 39.09
            WHEN lt.event_name = '100 FL SCY' THEN lt.best_time - 92.29
            WHEN lt.event_name = '100 IM SCY' THEN lt.best_time - 87.89
            WHEN lt.event_name = '200 IM SCY' THEN lt.best_time - 188.89
        END) < 0 THEN '✅ ALREADY FASTER'
        ELSE '⚠️ NEEDS IMPROVEMENT'
    END as status
FROM latest_times lt
WHERE lt.event_name LIKE '% SCY'
ORDER BY gap_to_a DESC NULLS LAST;

-- This shows what the A gap SHOULD be for each event
-- Compare with what your screenshot shows (0.09s for 200 FR?)

-- ========================================
-- SUMMARY
-- ========================================
SELECT
    '========================================' as separator,
    'DIAGNOSTIC COMPLETE' as status,
    '========================================' as separator2;

SELECT
    'Next Steps:' as instruction,
    CASE
        WHEN (SELECT COUNT(DISTINCT id) FROM swimmers WHERE full_name LIKE '%Vihaan%' OR full_name LIKE '%Vihang%') > 1
        THEN '1. CRITICAL: Execute FIX_ALL_ISSUES.sql to merge duplicate swimmers'
        ELSE '1. No duplicates found - skip duplicate fix'
    END as step1,
    CASE
        WHEN (SELECT COUNT(*) FROM competition_results WHERE meet_name = '14 & Under Division A B/C meet' AND time_standard IS NOT NULL) < 5
        THEN '2. REQUIRED: Execute FIX_ALL_ISSUES.sql to update time standards'
        ELSE '2. Time standards already updated'
    END as step2,
    '3. Hard refresh web app (Ctrl+Shift+R)' as step3,
    '4. Re-check gap analysis charts' as step4;
