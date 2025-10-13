-- ========================================
-- ALL-IN-ONE FIX SCRIPT
-- ========================================
-- This script fixes ALL identified issues in one execution:
-- 1. Merges duplicate "Vihaan" swimmer records
-- 2. Updates missing time standards for October 11-12 meet
-- 3. Verifies all fixes were applied correctly
--
-- Execute this ENTIRE script in Supabase SQL Editor
-- https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
-- ========================================

-- ========================================
-- PART 1: Merge Duplicate Swimmers
-- ========================================
DO $$
DECLARE
    v_keep_id INT;
    v_duplicate_ids INT[];
    v_duplicate_count INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PART 1: Merging Duplicate Swimmers';
    RAISE NOTICE '========================================';

    -- Find all Vihaan/Vihang records, ordered by creation date (oldest first)
    SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_duplicate_ids
    FROM swimmers
    WHERE full_name LIKE '%Vihaan%' OR full_name LIKE '%Vihang%'
       OR first_name LIKE '%Vihaan%' OR first_name LIKE '%Vihang%';

    -- Count duplicates
    v_duplicate_count := array_length(v_duplicate_ids, 1);

    IF v_duplicate_count IS NULL OR v_duplicate_count <= 1 THEN
        RAISE NOTICE 'ℹ️  No duplicates found. Skipping merge.';
    ELSE
        -- Keep the first (oldest) record
        v_keep_id := v_duplicate_ids[1];

        RAISE NOTICE 'Found % duplicate records', v_duplicate_count;
        RAISE NOTICE 'Keeping ID: % (oldest record)', v_keep_id;
        RAISE NOTICE 'Merging IDs: %', v_duplicate_ids;

        -- Update all competition_results to use the keeper ID
        UPDATE competition_results
        SET swimmer_id = v_keep_id
        WHERE swimmer_id = ANY(v_duplicate_ids[2:array_upper(v_duplicate_ids, 1)]);

        RAISE NOTICE '✅ Updated competition_results to use swimmer ID: %', v_keep_id;

        -- Delete the duplicate swimmer records (all except the keeper)
        DELETE FROM swimmers
        WHERE id = ANY(v_duplicate_ids[2:array_upper(v_duplicate_ids, 1)]);

        RAISE NOTICE '✅ Deleted % duplicate records', v_duplicate_count - 1;

        -- Update the keeper record to ensure it has correct, standardized info
        UPDATE swimmers
        SET
            first_name = 'Vihaan',
            last_name = 'Huchchannavar',
            current_age = 10,
            lsc = 'LAC-NT',
            club = 'LAC',
            active = true,
            updated_at = NOW()
        WHERE id = v_keep_id;

        RAISE NOTICE '✅ Successfully merged % duplicate records into ID %', v_duplicate_count, v_keep_id;
    END IF;
END $$;

-- ========================================
-- PART 2: Update Time Standards for October Meet
-- ========================================
DO $$
DECLARE
    v_update_count INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PART 2: Updating Time Standards';
    RAISE NOTICE '========================================';

    -- Update 50 FL SCY (41.63 seconds) → B standard
    UPDATE competition_results
    SET time_standard = 'B'
    WHERE meet_name = '14 & Under Division A B/C meet'
      AND event_name = '50 FL SCY'
      AND event_date = '2025-10-11'
      AND time_seconds = 41.63;

    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated 50 FL SCY: % row(s) → B standard', v_update_count;

    -- Update 100 FR SCY (74.72 seconds) → A standard (excellent!)
    UPDATE competition_results
    SET time_standard = 'A'
    WHERE meet_name = '14 & Under Division A B/C meet'
      AND event_name = '100 FR SCY'
      AND event_date = '2025-10-11'
      AND time_seconds = 74.72;

    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated 100 FR SCY: % row(s) → A standard 🏆', v_update_count;

    -- Update 200 FR SCY (166.56 seconds) → B standard
    UPDATE competition_results
    SET time_standard = 'B'
    WHERE meet_name = '14 & Under Division A B/C meet'
      AND event_name = '200 FR SCY'
      AND event_date = '2025-10-12'
      AND time_seconds = 166.56;

    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated 200 FR SCY: % row(s) → B standard', v_update_count;

    -- Update 100 FL SCY (97.56 seconds) → B standard
    UPDATE competition_results
    SET time_standard = 'B'
    WHERE meet_name = '14 & Under Division A B/C meet'
      AND event_name = '100 FL SCY'
      AND event_date = '2025-10-12'
      AND time_seconds = 97.56;

    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated 100 FL SCY: % row(s) → B standard', v_update_count;

    -- Update 200 IM SCY (189.73 seconds) → B standard
    UPDATE competition_results
    SET time_standard = 'B'
    WHERE meet_name = '14 & Under Division A B/C meet'
      AND event_name = '200 IM SCY'
      AND event_date = '2025-10-12'
      AND time_seconds = 189.73;

    GET DIAGNOSTICS v_update_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated 200 IM SCY: % row(s) → B standard', v_update_count;

    -- Note: 500 FR SCY left as NULL (standard not in our database)
    RAISE NOTICE 'ℹ️  500 FR SCY: Left as NULL (standard not defined)';

    RAISE NOTICE '✅ Time standards update complete!';
END $$;

-- ========================================
-- PART 3: Verification
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PART 3: Verification Results';
    RAISE NOTICE '========================================';
END $$;

-- Verify swimmers table
SELECT
    '👤 SWIMMERS' as check_type,
    COUNT(*) as record_count,
    STRING_AGG(full_name, ', ') as swimmer_names
FROM swimmers
WHERE full_name LIKE '%Vihaan%' OR full_name LIKE '%Vihang%';

-- Verify October meet results
SELECT
    '📊 OCTOBER MEET RESULTS' as check_type,
    event_name,
    event_date,
    time_formatted as time,
    time_standard,
    CASE
        WHEN time_standard = 'A' THEN '🏆 A Standard'
        WHEN time_standard = 'BB' THEN '🥇 BB Standard'
        WHEN time_standard = 'B' THEN '🥈 B Standard'
        ELSE '⚠️ No Standard'
    END as achievement
FROM competition_results
WHERE meet_name = '14 & Under Division A B/C meet'
ORDER BY event_date, event_name;

-- Count all competition results per swimmer
SELECT
    '📈 COMPETITION RESULTS COUNT' as check_type,
    s.id as swimmer_id,
    s.full_name,
    COUNT(cr.id) as total_events,
    COUNT(CASE WHEN cr.time_standard = 'A' THEN 1 END) as a_times,
    COUNT(CASE WHEN cr.time_standard = 'BB' THEN 1 END) as bb_times,
    COUNT(CASE WHEN cr.time_standard = 'B' THEN 1 END) as b_times
FROM swimmers s
LEFT JOIN competition_results cr ON s.id = cr.swimmer_id
WHERE s.full_name LIKE '%Vihaan%' OR s.full_name LIKE '%Vihang%'
GROUP BY s.id, s.full_name;

-- ========================================
-- Summary
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL FIXES COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Refresh your web app (hard refresh: Ctrl+Shift+R)';
    RAISE NOTICE '2. Check swimmer dropdown → Should show ONE entry';
    RAISE NOTICE '3. Check Recent Achievements → Should show 5 new achievements';
    RAISE NOTICE '4. Check Overview chart → BB/B/A lines should display';
    RAISE NOTICE '5. Check Personal Records → Accurate time standards';
    RAISE NOTICE '';
    RAISE NOTICE 'If issues persist, check browser console (F12) for errors';
    RAISE NOTICE '========================================';
END $$;
