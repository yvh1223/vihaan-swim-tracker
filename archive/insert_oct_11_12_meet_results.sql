-- ========================================
-- Insert Meet Results: 14 & Under Division A B/C meet
-- October 11-12, 2025
-- ========================================
--
-- Run this SQL in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
--

-- Step 1: Get the swimmer_id for Vihaan Huchchannavar
-- Run this first to get the ID, then use it in the INSERT statements below
SELECT id, full_name, current_age, lsc, club
FROM swimmers
WHERE full_name = 'Vihaan Huchchannavar'
   OR full_name LIKE '%Vihaan%Huchchannavar%'
LIMIT 1;

-- ========================================
-- Step 2: Insert the 6 meet results
-- Replace <SWIMMER_ID> with the actual ID from Step 1
-- ========================================

-- If swimmer doesn't exist, create the record first:
-- INSERT INTO swimmers (first_name, last_name, full_name, date_of_birth, current_age, lsc, club, active)
-- VALUES ('Vihaan', 'Huchchannavar', 'Vihaan Huchchannavar', '2015-XX-XX', 10, 'LAC-NT', 'LAC', true)
-- RETURNING id;

INSERT INTO competition_results (
    swimmer_id,
    event_name,
    meet_name,
    event_date,
    time_formatted,
    time_seconds,
    course_type,
    distance,
    stroke,
    time_standard,
    points,
    lsc,
    team,
    age,
    notes
) VALUES

    -- ========================================
    -- October 11, 2025 - Day 1
    -- ========================================

    -- Event 10: Boys 10&U 50 Yard Fly
    (
        <SWIMMER_ID>,                    -- Replace with actual swimmer_id
        '50 FL SCY',
        '14 & Under Division A B/C meet',
        '2025-10-11',
        '41.63',
        41.63,
        'SCY',
        50,
        'FL',
        NULL,                            -- Will be calculated by view
        0,
        'LAC-NT',
        'LAC',
        10,
        'Place: 2 | Finals: 41.63 | Entry: 42.34 | Dropped: -0.71 | Heat: 1 | Lane: 5'
    ),

    -- Event 18: Boys 10&U 100 Yard Free
    (
        <SWIMMER_ID>,
        '100 FR SCY',
        '14 & Under Division A B/C meet',
        '2025-10-11',
        '1:14.72',
        74.72,                           -- 1:14.72 = 74.72 seconds
        'SCY',
        100,
        'FR',
        NULL,
        0,
        'LAC-NT',
        'LAC',
        10,
        'Place: 1 | Finals: 1:14.72 | Time improvement: -5.39 | Finals 0-10'
    ),

    -- Event 26: Boys 10&U 500 Yard Free
    (
        <SWIMMER_ID>,
        '500 FR SCY',
        '14 & Under Division A B/C meet',
        '2025-10-11',
        '7:20.72',
        440.72,                          -- 7:20.72 = 440.72 seconds
        'SCY',
        500,
        'FR',
        NULL,
        0,
        'LAC-NT',
        'LAC',
        10,
        'Place: 3 | Finals: 7:20.72 | Finals 0-10'
    ),

    -- ========================================
    -- October 12, 2025 - Day 2
    -- ========================================

    -- Event 46: Boys 10&U 200 Yard Free
    (
        <SWIMMER_ID>,
        '200 FR SCY',
        '14 & Under Division A B/C meet',
        '2025-10-12',
        '2:46.56',
        166.56,                          -- 2:46.56 = 166.56 seconds
        'SCY',
        200,
        'FR',
        NULL,
        0,
        'LAC-NT',
        'LAC',
        10,
        'Place: 1 | Finals: 2:46.56 | Time improvement: -6.41 | Finals 0-10'
    ),

    -- Event 58: Boys 10&U 100 Yard Fly
    (
        <SWIMMER_ID>,
        '100 FL SCY',
        '14 & Under Division A B/C meet',
        '2025-10-12',
        '1:37.56',
        97.56,                           -- 1:37.56 = 97.56 seconds
        'SCY',
        100,
        'FL',
        NULL,
        0,
        'LAC-NT',
        'LAC',
        10,
        'Place: 1 | Finals: 1:37.56 | Finals 0-10'
    ),

    -- Event 70: Boys 10&U 200 Yard IM
    (
        <SWIMMER_ID>,
        '200 IM SCY',
        '14 & Under Division A B/C meet',
        '2025-10-12',
        '3:09.73',
        189.73,                          -- 3:09.73 = 189.73 seconds
        'SCY',
        200,
        'IM',
        NULL,
        0,
        'LAC-NT',
        'LAC',
        10,
        'Place: 2 | Finals: 3:09.73 | Finals 0-10'
    );

-- ========================================
-- Step 3: Verify the inserted data
-- ========================================

SELECT
    event_name,
    event_date,
    time_formatted,
    time_seconds,
    meet_name,
    notes
FROM competition_results
WHERE swimmer_id = <SWIMMER_ID>
    AND meet_name = '14 & Under Division A B/C meet'
ORDER BY event_date, event_name;

-- Expected: 6 rows
-- Oct 11: 50 FL, 100 FR, 500 FR
-- Oct 12: 200 FR, 100 FL, 200 IM

-- ========================================
-- Step 4: Check calculated standards and personal bests
-- ========================================

-- If you have the competition_results_with_standards view:
SELECT
    event_name,
    event_date,
    time_formatted,
    calculated_standard,
    next_standard,
    gap_seconds,
    improvement_needed_pct,
    is_personal_best
FROM competition_results_with_standards
WHERE swimmer_id = <SWIMMER_ID>
    AND meet_name = '14 & Under Division A B/C meet'
ORDER BY event_date, event_name;

-- ========================================
-- Step 5: Check personal bests summary
-- ========================================

SELECT
    swimmer_id,
    event_name,
    best_time_formatted,
    achieved_date
FROM personal_bests
WHERE swimmer_id = <SWIMMER_ID>
    AND event_name IN ('50 FL SCY', '100 FR SCY', '500 FR SCY', '200 FR SCY', '100 FL SCY', '200 IM SCY')
ORDER BY event_name;

-- ========================================
-- Expected Personal Bests from this meet:
-- ========================================
-- ✅ 50 FL SCY: 41.63 (improvement from 42.34)
-- ✅ 100 FR SCY: 1:14.72 (improvement from 1:20.11)
-- 🆕 500 FR SCY: 7:20.72 (first time)
-- ❌ 200 FR SCY: 2:46.56 (slower than 2:45.08)
-- ✅ 100 FL SCY: 1:37.56 (improvement from 1:40.26)
-- ❌ 200 IM SCY: 3:09.73 (slower than 3:06.13)
