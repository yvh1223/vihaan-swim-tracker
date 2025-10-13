-- ========================================
-- Insert New Meet Results from Screenshots
-- ========================================
--
-- IMPORTANT: Before running this SQL:
-- 1. Replace 'MEET_NAME_HERE' with the actual meet name from your records
-- 2. Replace '2025-10-XX' with the actual meet date(s)
-- 3. Verify the swimmer_id matches Vihaan's ID in your swimmers table
-- 4. Confirm course type (SCY assumed based on recent patterns)
--
-- Run this SQL in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
--

-- Step 1: Get the swimmer_id for Vihaan (run this first to confirm)
-- SELECT id, full_name FROM swimmers WHERE full_name LIKE '%Vihaan%';

-- Step 2: Insert the new meet results
-- Replace <SWIMMER_ID> with the actual ID from Step 1
-- Replace 'MEET_NAME_HERE' with actual meet name
-- Replace '2025-10-XX' with actual event dates

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
    -- Event 10: Boys 10&U 50 Yard Fly - Finals
    (
        <SWIMMER_ID>,                    -- swimmer_id (replace with actual ID)
        '50 FL SCY',                     -- event_name
        'MEET_NAME_HERE',                -- meet_name (REPLACE THIS)
        '2025-10-XX',                    -- event_date (REPLACE THIS)
        '41.63',                         -- time_formatted
        41.63,                           -- time_seconds
        'SCY',                           -- course_type
        50,                              -- distance
        'FL',                            -- stroke (Fly)
        NULL,                            -- time_standard (will be calculated by view)
        0,                               -- points (shown as 0 in screenshot)
        'LAC-NT',                        -- lsc
        'LAC-NT',                        -- team
        10,                              -- age
        'Place: 2 | Time improvement: -0.71 | Finals 0-10'  -- notes
    ),

    -- Event 18: Boys 10&U 100 Yard Free - Finals
    (
        <SWIMMER_ID>,
        '100 FR SCY',
        'MEET_NAME_HERE',
        '2025-10-XX',
        '1:14.72',
        74.72,                           -- 1:14.72 = 74.72 seconds
        'SCY',
        100,
        'FR',
        NULL,
        0,
        'LAC-NT',
        'LAC-NT',
        10,
        'Place: 1 | Time improvement: -5.39 | Finals 0-10'
    ),

    -- Event 26: Boys 10&U 500 Yard Free - Finals
    (
        <SWIMMER_ID>,
        '500 FR SCY',
        'MEET_NAME_HERE',
        '2025-10-XX',
        '7:20.72',
        440.72,                          -- 7:20.72 = 440.72 seconds
        'SCY',
        500,
        'FR',
        NULL,
        0,
        'LAC-NT',
        'LAC-NT',
        10,
        'Place: 3 | Finals 0-10'
    ),

    -- Event 46: Boys 10&U 200 Yard Free - Finals
    (
        <SWIMMER_ID>,
        '200 FR SCY',
        'MEET_NAME_HERE',
        '2025-10-XX',
        '2:46.56',
        166.56,                          -- 2:46.56 = 166.56 seconds
        'SCY',
        200,
        'FR',
        NULL,
        0,
        'LAC-NT',
        'LAC-NT',
        10,
        'Place: 1 | Time improvement: -6.41 | Finals 0-10'
    ),

    -- Event 58: Boys 10&U 100 Yard Fly - Finals
    (
        <SWIMMER_ID>,
        '100 FL SCY',
        'MEET_NAME_HERE',
        '2025-10-XX',
        '1:37.56',
        97.56,                           -- 1:37.56 = 97.56 seconds
        'SCY',
        100,
        'FL',
        NULL,
        0,
        'LAC-NT',
        'LAC-NT',
        10,
        'Place: 1 | Finals 0-10'
    ),

    -- Event 70: Boys 10&U 200 Yard IM - Finals
    (
        <SWIMMER_ID>,
        '200 IM SCY',
        'MEET_NAME_HERE',
        '2025-10-XX',
        '3:09.73',
        189.73,                          -- 3:09.73 = 189.73 seconds
        'SCY',
        200,
        'IM',
        NULL,
        0,
        'LAC-NT',
        'LAC-NT',
        10,
        'Place: 2 | Finals 0-10'
    );

-- Step 3: Verify the inserted data
SELECT
    event_name,
    event_date,
    time_formatted,
    time_seconds,
    meet_name,
    notes
FROM competition_results
WHERE swimmer_id = <SWIMMER_ID>
    AND meet_name = 'MEET_NAME_HERE'
ORDER BY event_date, event_name;

-- Step 4: Check calculated standards (if you have the competition_results_with_standards view)
-- SELECT
--     event_name,
--     time_formatted,
--     calculated_standard,
--     next_standard,
--     gap_seconds,
--     is_personal_best
-- FROM competition_results_with_standards
-- WHERE swimmer_id = <SWIMMER_ID>
--     AND meet_name = 'MEET_NAME_HERE'
-- ORDER BY event_date, event_name;

-- ========================================
-- Time Conversion Reference
-- ========================================
-- MM:SS.SS format conversion:
-- 41.63 = 41.63 seconds (under 1 minute)
-- 1:14.72 = 60 + 14.72 = 74.72 seconds
-- 1:37.56 = 60 + 37.56 = 97.56 seconds
-- 2:46.56 = 120 + 46.56 = 166.56 seconds
-- 3:09.73 = 180 + 9.73 = 189.73 seconds
-- 7:20.72 = 420 + 20.72 = 440.72 seconds
