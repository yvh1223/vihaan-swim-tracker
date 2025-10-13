-- ========================================
-- Fix Duplicate Swimmer Records
-- ========================================
-- This script identifies and merges duplicate "Vihang" swimmer records

-- Step 1: Find all Vihang/Vihaan records
SELECT
    id,
    first_name,
    last_name,
    full_name,
    current_age,
    lsc,
    club,
    active,
    created_at,
    updated_at
FROM swimmers
WHERE full_name LIKE '%Vihaan%' OR full_name LIKE '%Vihang%' OR first_name LIKE '%Vihaan%' OR first_name LIKE '%Vihang%'
ORDER BY created_at;

-- This will show us all the duplicate records and their IDs
-- Review the output to identify which ID to keep (usually the oldest with most complete data)

-- ========================================
-- Step 2: Automatic Merge (Smart Detection)
-- ========================================
-- This script automatically finds duplicates and merges them
-- It keeps the OLDEST record (first created) as the keeper

DO $$
DECLARE
    v_keep_id INT;
    v_duplicate_ids INT[];
    v_duplicate_count INT;
BEGIN
    -- Find all Vihaan/Vihang records, ordered by creation date (oldest first)
    SELECT ARRAY_AGG(id ORDER BY created_at) INTO v_duplicate_ids
    FROM swimmers
    WHERE full_name LIKE '%Vihaan%' OR full_name LIKE '%Vihang%'
       OR first_name LIKE '%Vihaan%' OR first_name LIKE '%Vihang%';

    -- Count duplicates
    v_duplicate_count := array_length(v_duplicate_ids, 1);

    IF v_duplicate_count IS NULL OR v_duplicate_count <= 1 THEN
        RAISE NOTICE 'No duplicates found. Nothing to merge.';
        RETURN;
    END IF;

    -- Keep the first (oldest) record
    v_keep_id := v_duplicate_ids[1];

    RAISE NOTICE 'Found % duplicate records. Keeping ID: %', v_duplicate_count, v_keep_id;
    RAISE NOTICE 'Duplicate IDs to merge: %', v_duplicate_ids;

    -- Update all competition_results to use the keeper ID
    UPDATE competition_results
    SET swimmer_id = v_keep_id
    WHERE swimmer_id = ANY(v_duplicate_ids[2:array_upper(v_duplicate_ids, 1)]);

    RAISE NOTICE 'Updated competition_results to use swimmer ID: %', v_keep_id;

    -- Delete the duplicate swimmer records (all except the keeper)
    DELETE FROM swimmers
    WHERE id = ANY(v_duplicate_ids[2:array_upper(v_duplicate_ids, 1)]);

    RAISE NOTICE 'Deleted % duplicate records', v_duplicate_count - 1;

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
END $$;

-- ========================================
-- Step 3: Verify the merge
-- ========================================
-- After executing Step 2, run these queries to verify:

-- Check that only one Vihaan record exists
SELECT COUNT(*) as swimmer_count, first_name, last_name
FROM swimmers
WHERE full_name LIKE '%Vihaan%' OR full_name LIKE '%Vihang%'
GROUP BY first_name, last_name;

-- Check that all competition results are assigned correctly
SELECT
    s.id as swimmer_id,
    s.full_name,
    COUNT(cr.id) as result_count
FROM swimmers s
LEFT JOIN competition_results cr ON s.id = cr.swimmer_id
WHERE s.full_name LIKE '%Vihaan%' OR s.full_name LIKE '%Vihang%'
GROUP BY s.id, s.full_name;

-- Expected result: One swimmer with all competition results assigned
