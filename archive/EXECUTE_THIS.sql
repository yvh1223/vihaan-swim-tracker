-- ========================================
-- QUICK EXECUTE: October 11-12, 2025 Meet Results
-- 14 & Under Division A B/C meet
-- ========================================
--
-- INSTRUCTIONS:
-- 1. Copy this ENTIRE file
-- 2. Open Supabase SQL Editor: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
-- 3. Paste and click "Run"
-- 4. Script will automatically:
--    - Find or create Vihaan's swimmer record
--    - Insert all 6 events
--    - Show verification results
--
-- ========================================

-- Create swimmer if doesn't exist, or get existing ID
DO $$
DECLARE
    v_swimmer_id INT;
BEGIN
    -- Try to find existing swimmer
    SELECT id INTO v_swimmer_id
    FROM swimmers
    WHERE full_name = 'Vihaan Huchchannavar'
       OR (first_name = 'Vihaan' AND last_name = 'Huchchannavar')
    LIMIT 1;

    -- If not found, create the swimmer
    IF v_swimmer_id IS NULL THEN
        INSERT INTO swimmers (
            first_name,
            last_name,
            current_age,
            lsc,
            club,
            active
        ) VALUES (
            'Vihaan',
            'Huchchannavar',
            10,
            'LAC-NT',
            'LAC',
            true
        )
        RETURNING id INTO v_swimmer_id;

        RAISE NOTICE 'Created new swimmer with ID: %', v_swimmer_id;
    ELSE
        RAISE NOTICE 'Found existing swimmer with ID: %', v_swimmer_id;
    END IF;

    -- Insert the 6 meet results
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
        -- October 11, 2025 - Day 1
        (v_swimmer_id, '50 FL SCY', '14 & Under Division A B/C meet', '2025-10-11', '41.63', 41.63, 'SCY', 50, 'FL', NULL, 0, 'LAC-NT', 'LAC', 10, 'Place: 2 | Finals: 41.63 | Entry: 42.34 | Dropped: -0.71 | Heat: 1 | Lane: 5'),
        (v_swimmer_id, '100 FR SCY', '14 & Under Division A B/C meet', '2025-10-11', '1:14.72', 74.72, 'SCY', 100, 'FR', NULL, 0, 'LAC-NT', 'LAC', 10, 'Place: 1 | Finals: 1:14.72 | Time improvement: -5.39'),
        (v_swimmer_id, '500 FR SCY', '14 & Under Division A B/C meet', '2025-10-11', '7:20.72', 440.72, 'SCY', 500, 'FR', NULL, 0, 'LAC-NT', 'LAC', 10, 'Place: 3 | Finals: 7:20.72'),
        -- October 12, 2025 - Day 2
        (v_swimmer_id, '200 FR SCY', '14 & Under Division A B/C meet', '2025-10-12', '2:46.56', 166.56, 'SCY', 200, 'FR', NULL, 0, 'LAC-NT', 'LAC', 10, 'Place: 1 | Finals: 2:46.56 | Time improvement: -6.41'),
        (v_swimmer_id, '100 FL SCY', '14 & Under Division A B/C meet', '2025-10-12', '1:37.56', 97.56, 'SCY', 100, 'FL', NULL, 0, 'LAC-NT', 'LAC', 10, 'Place: 1 | Finals: 1:37.56'),
        (v_swimmer_id, '200 IM SCY', '14 & Under Division A B/C meet', '2025-10-12', '3:09.73', 189.73, 'SCY', 200, 'IM', NULL, 0, 'LAC-NT', 'LAC', 10, 'Place: 2 | Finals: 3:09.73')
    ON CONFLICT DO NOTHING;  -- Skip if exact duplicate exists

    RAISE NOTICE 'Inserted meet results for swimmer ID: %', v_swimmer_id;
END $$;

-- Verify the results
SELECT
    '✅ INSERTED RESULTS' as status,
    event_name,
    event_date,
    time_formatted as time,
    notes
FROM competition_results
WHERE meet_name = '14 & Under Division A B/C meet'
ORDER BY event_date, event_name;

-- Show swimmer info
SELECT
    '👤 SWIMMER INFO' as status,
    id,
    full_name,
    current_age as age,
    lsc,
    club
FROM swimmers
WHERE full_name = 'Vihaan Huchchannavar'
LIMIT 1;
