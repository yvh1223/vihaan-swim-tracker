-- ========================================
-- Update Time Standards for October 11-12, 2025 Meet
-- ========================================
-- The newly imported competition results have NULL time_standard values
-- This script calculates and updates the correct time standards based on actual times

-- Update 50 FL SCY (41.63 seconds) - Current: NULL, Should be: B
-- Standard: BB=44.79, B=50.49, A=39.09
-- 41.63 is between A (39.09) and BB (44.79), so it's B standard
UPDATE competition_results
SET time_standard = 'B'
WHERE meet_name = '14 & Under Division A B/C meet'
  AND event_name = '50 FL SCY'
  AND event_date = '2025-10-11'
  AND time_seconds = 41.63;

-- Update 100 FR SCY (74.72 seconds) - Current: NULL, Should be: BB
-- Standard: BB=86.99, B=96.99, A=76.99
-- 74.72 is better than A (76.99), so it's A standard!
UPDATE competition_results
SET time_standard = 'A'
WHERE meet_name = '14 & Under Division A B/C meet'
  AND event_name = '100 FR SCY'
  AND event_date = '2025-10-11'
  AND time_seconds = 74.72;

-- Update 500 FR SCY (440.72 seconds = 7:20.72) - Need to check standard
-- Note: 500 FR standards not in our timeStandards object, needs manual verification
-- For now, mark as NULL and verify later
UPDATE competition_results
SET time_standard = NULL
WHERE meet_name = '14 & Under Division A B/C meet'
  AND event_name = '500 FR SCY'
  AND event_date = '2025-10-11'
  AND time_seconds = 440.72;

-- Update 200 FR SCY (166.56 seconds = 2:46.56) - Current: NULL, Should be: BB
-- Standard: BB=185.69, B=206.29, A=164.99
-- 166.56 is between A (164.99) and BB (185.69), so it's B standard
UPDATE competition_results
SET time_standard = 'B'
WHERE meet_name = '14 & Under Division A B/C meet'
  AND event_name = '200 FR SCY'
  AND event_date = '2025-10-12'
  AND time_seconds = 166.56;

-- Update 100 FL SCY (97.56 seconds = 1:37.56) - Current: NULL, Should be: B
-- Standard: BB=108.29, B=124.19, A=92.29
-- 97.56 is between A (92.29) and BB (108.29), so it's B standard
UPDATE competition_results
SET time_standard = 'B'
WHERE meet_name = '14 & Under Division A B/C meet'
  AND event_name = '100 FL SCY'
  AND event_date = '2025-10-12'
  AND time_seconds = 97.56;

-- Update 200 IM SCY (189.73 seconds = 3:09.73) - Current: NULL, Should be: B
-- Standard: BB=213.49, B=238.09, A=188.89
-- 189.73 is between A (188.89) and BB (213.49), so it's B standard
UPDATE competition_results
SET time_standard = 'B'
WHERE meet_name = '14 & Under Division A B/C meet'
  AND event_name = '200 IM SCY'
  AND event_date = '2025-10-12'
  AND time_seconds = 189.73;

-- ========================================
-- Verification Query
-- ========================================
SELECT
    event_name,
    event_date,
    time_formatted,
    time_seconds,
    time_standard,
    notes
FROM competition_results
WHERE meet_name = '14 & Under Division A B/C meet'
ORDER BY event_date, event_name;

-- Expected results:
-- 50 FL SCY   | 2025-10-11 | 41.63    | 41.63   | B    | Place: 2 | Finals: 41.63 | Entry: 42.34 | Dropped: -0.71
-- 100 FR SCY  | 2025-10-11 | 1:14.72  | 74.72   | A    | Place: 1 | Finals: 1:14.72 | Time improvement: -5.39
-- 500 FR SCY  | 2025-10-11 | 7:20.72  | 440.72  | NULL | Place: 3 | Finals: 7:20.72
-- 200 FR SCY  | 2025-10-12 | 2:46.56  | 166.56  | B    | Place: 1 | Finals: 2:46.56 | Time improvement: -6.41
-- 100 FL SCY  | 2025-10-12 | 1:37.56  | 97.56   | B    | Place: 1 | Finals: 1:37.56
-- 200 IM SCY  | 2025-10-12 | 3:09.73  | 189.73  | B    | Place: 2 | Finals: 3:09.73
