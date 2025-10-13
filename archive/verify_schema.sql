-- ========================================
-- Schema Verification and Validation
-- ========================================
--
-- Run this SQL in Supabase SQL Editor to verify your database
-- is ready for screenshot data import
--
-- https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
--

-- ========================================
-- 1. Check if all required tables exist
-- ========================================

SELECT
    table_name,
    CASE
        WHEN table_name IN ('swimmers', 'competition_results', 'team_progression', 'time_standards')
        THEN '✅ Core Table'
        WHEN table_name IN ('personal_bests', 'progress_report', 'competition_results_with_standards', 'latest_times_per_event')
        THEN '✅ View/Calculated Table'
        ELSE '❓ Other'
    END as table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type IN ('BASE TABLE', 'VIEW')
ORDER BY table_name;

-- Expected tables:
-- ✅ swimmers
-- ✅ competition_results
-- ✅ team_progression
-- ✅ time_standards
-- ✅ personal_bests (view)
-- ✅ progress_report (view)
-- ✅ competition_results_with_standards (view)
-- ✅ latest_times_per_event (view)

-- ========================================
-- 2. Verify swimmers table has data
-- ========================================

SELECT
    'Swimmers Table' as check_name,
    COUNT(*) as record_count,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE '⚠️ EMPTY - Need to add swimmers'
    END as status
FROM swimmers;

-- Show all swimmers
SELECT
    id,
    full_name,
    current_age,
    lsc,
    club,
    active
FROM swimmers
ORDER BY full_name;

-- ========================================
-- 3. Verify time_standards table has data
-- ========================================

SELECT
    'Time Standards Table' as check_name,
    COUNT(*) as record_count,
    CASE
        WHEN COUNT(*) >= 500 THEN '✅ Fully loaded (expected ~518 records)'
        WHEN COUNT(*) > 0 THEN '⚠️ Partially loaded'
        ELSE '❌ EMPTY - Need to load time standards'
    END as status
FROM time_standards;

-- Verify coverage
SELECT
    course_type,
    gender,
    age_group_code,
    COUNT(*) as event_count
FROM time_standards
GROUP BY course_type, gender, age_group_code
ORDER BY course_type, gender, age_group_code;

-- ========================================
-- 4. Check competition_results table
-- ========================================

SELECT
    'Competition Results Table' as check_name,
    COUNT(*) as record_count,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ Has data'
        ELSE 'ℹ️ Empty (normal for new setup)'
    END as status
FROM competition_results;

-- Show recent results if any exist
SELECT
    cr.event_name,
    cr.event_date,
    cr.time_formatted,
    cr.meet_name,
    s.full_name as swimmer_name,
    cr.age
FROM competition_results cr
JOIN swimmers s ON cr.swimmer_id = s.id
ORDER BY cr.event_date DESC
LIMIT 10;

-- ========================================
-- 5. Verify column structure for competition_results
-- ========================================

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'competition_results'
ORDER BY ordinal_position;

-- Expected columns:
-- ✅ id (integer/bigint)
-- ✅ swimmer_id (integer/bigint)
-- ✅ event_name (varchar)
-- ✅ meet_name (varchar)
-- ✅ event_date (date)
-- ✅ time_formatted (varchar)
-- ✅ time_seconds (decimal/numeric)
-- ✅ course_type (varchar)
-- ✅ distance (integer)
-- ✅ stroke (varchar)
-- ✅ time_standard (varchar, nullable)
-- ✅ points (integer)
-- ✅ lsc (varchar)
-- ✅ team (varchar)
-- ✅ age (integer)
-- ✅ notes (text)
-- ✅ created_at (timestamp)
-- ✅ updated_at (timestamp)

-- ========================================
-- 6. Check if views exist (optional but recommended)
-- ========================================

-- List all views
SELECT
    table_name,
    '✅ View exists' as status
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ========================================
-- 7. Test time standard lookup for screenshot events
-- ========================================

-- For Vihaan (Age 10, Boys, SCY)
-- Test if standards exist for the new events

SELECT
    event_name,
    b_standard,
    bb_standard,
    a_standard,
    'Standard exists for this event' as status
FROM time_standards
WHERE age_group_code = '10U'
    AND gender = 'Boys'
    AND course_type = 'SCY'
    AND event_name IN ('50 FL', '100 FR', '500 FR', '200 FR', '100 FL', '200 IM')
ORDER BY event_name;

-- If any events are missing, you'll need to add them to time_standards

-- ========================================
-- 8. Check for duplicate prevention
-- ========================================

-- Verify unique constraints exist on competition_results
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
    AND table_name = 'competition_results'
    AND constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- Note: You may want to add a unique constraint to prevent duplicate results:
-- UNIQUE(swimmer_id, event_name, meet_name, event_date)

-- ========================================
-- 9. Row Level Security (RLS) Check
-- ========================================

SELECT
    tablename,
    CASE
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '⚠️ RLS Disabled (consider enabling for production)'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('swimmers', 'competition_results', 'team_progression', 'time_standards')
ORDER BY tablename;

-- ========================================
-- 10. Database Health Summary
-- ========================================

SELECT
    '=== DATABASE READINESS SUMMARY ===' as summary;

-- Swimmers
SELECT
    'Swimmers' as table_name,
    COUNT(*) as records,
    CASE WHEN COUNT(*) > 0 THEN '✅ READY' ELSE '⚠️ NEEDS DATA' END as status
FROM swimmers
UNION ALL
-- Competition Results
SELECT
    'Competition Results' as table_name,
    COUNT(*) as records,
    'ℹ️ Ready for import' as status
FROM competition_results
UNION ALL
-- Time Standards
SELECT
    'Time Standards' as table_name,
    COUNT(*) as records,
    CASE
        WHEN COUNT(*) >= 500 THEN '✅ READY'
        ELSE '❌ NEEDS DATA'
    END as status
FROM time_standards
ORDER BY table_name;

-- ========================================
-- NEXT STEPS BASED ON RESULTS
-- ========================================

/*
IF swimmers table is empty:
  → Run SQL to create swimmer record for Vihaan

IF time_standards table is empty:
  → Run scripts/complete-setup.js to load 518 standards
  OR
  → Manually load usa_swimming_standards_cleaned_all.csv

IF all checks pass:
  → You're ready to use insert_new_meet_results.sql
  → Get swimmer_id from swimmers table
  → Fill in meet name and dates
  → Execute INSERT statements

IF any views are missing:
  → Create views for progress_report, personal_bests, etc.
  → These are optional but recommended for analytics
*/
