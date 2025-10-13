-- Fix reversed time standards in time_standards table
-- The standards were loaded in reverse order (fastest in B, slowest in AAAA)
-- This script swaps them to the correct order

-- Create a temporary column to help with the swap
ALTER TABLE time_standards ADD COLUMN IF NOT EXISTS temp_swap NUMERIC;

-- Swap B <-> AAAA
UPDATE time_standards
SET temp_swap = b_standard,
    b_standard = aaaa_standard,
    aaaa_standard = temp_swap;

-- Swap BB <-> AAA
UPDATE time_standards
SET temp_swap = bb_standard,
    bb_standard = aaa_standard,
    aaa_standard = temp_swap;

-- Swap A <-> AA (these are adjacent, so they just swap)
UPDATE time_standards
SET temp_swap = a_standard,
    a_standard = aa_standard,
    aa_standard = temp_swap;

-- Drop the temporary column
ALTER TABLE time_standards DROP COLUMN temp_swap;

-- Verify the fix for 50 FL Boys 10U
SELECT
    event_name,
    age_group,
    gender,
    course_type,
    b_standard,
    bb_standard,
    a_standard,
    aa_standard,
    aaa_standard,
    aaaa_standard
FROM time_standards
WHERE event_name = '50 FL'
  AND age_group = '10 & under'
  AND gender = 'Boys'
  AND course_type = 'SCY';

-- Expected result: B=46.49, BB=41.29, A=35.99, AA=34.29, AAA=32.59, AAAA=30.79
