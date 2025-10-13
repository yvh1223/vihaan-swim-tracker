# Time Standards Calculation Fix - Summary

## Problems Identified

### 1. **Reversed Column Values in time_standards Table** ✅ FIXED
   - The time standards were loaded with values in reverse order
   - Fastest times (AAAA) were in the B column
   - Slowest times (B) were in the AAAA column
   - **Status**: Fixed by swapping all 518 records

### 2. **Incorrect Function Column Names** ⚠️ NEEDS SQL EXECUTION
   - Functions reference `aaaa_time`, `bb_time`, etc.
   - Actual table has `aaaa_standard`, `bb_standard`, etc.
   - Functions don't match on gender or course_type properly
   - Functions use TEXT age_group parameter instead of INTEGER age

### 3. **Missing Gender Column** ⚠️ NEEDS SQL EXECUTION
   - Swimmers table doesn't have a `gender` column
   - Time standards vary significantly by gender
   - Currently defaulting to 'Boys' but this should be explicit

### 4. **Hardcoded Age Groups** ⚠️ NEEDS SQL EXECUTION
   - Views hardcode age '10' instead of using the actual age from the data
   - Need age-to-age_group conversion function

## Solutions Implemented

### ✅ Completed
1. **Fixed Reversed Time Standards**
   - Executed: `/scripts/fix_time_standards_via_api.sh`
   - Result: All 518 records now have correct values
   - Verified: 50 FL Boys 10U now shows B=46.49, BB=41.29 (correct)

### ⚠️  SQL Scripts Ready (Need Execution)
2. **Complete Fix Script Created**
   - File: `/scripts/complete_fix_all_calculations.sql`
   - This script will:
     - Add gender column to swimmers table
     - Create age_group conversion function
     - Fix get_current_standard() function to use correct columns
     - Fix get_next_standard_info() function to use correct columns
     - Update competition_results_with_standards view
     - Update progress_report view

## How to Apply Remaining Fixes

### Option 1: Via Supabase Dashboard (Recommended)
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp
2. Go to SQL Editor
3. Copy contents of `/scripts/complete_fix_all_calculations.sql`
4. Execute the script
5. Verify with test queries at the end of the script

### Option 2: Via psql Command Line
```bash
psql "postgresql://postgres.gwqwpicbtkamojwwlmlp:Vihaan@123@aws-0-us-east-1.pooler.supabase.com:6543/postgres" < scripts/complete_fix_all_calculations.sql
```

### Option 3: Via Supabase CLI
```bash
supabase db execute --file scripts/complete_fix_all_calculations.sql
```

## Verification After Fix

Run these queries to verify everything works:

```sql
-- Test 1: Check 50 FL calculation for Vihaan's time
SELECT
    get_current_standard('50 FL', 41.63, 10, 'Boys', 'SCY') as standard,
    *
FROM get_next_standard_info('50 FL', 41.63, 10, 'Boys', 'SCY');
-- Expected: standard='B', next_level='BB', target_time=41.29, gap_seconds=0.34

-- Test 2: Check view calculations
SELECT
    event_name,
    event_date,
    time_seconds,
    calculated_standard,
    next_standard,
    next_target_seconds,
    gap_seconds
FROM competition_results_with_standards
WHERE event_name = '50 FL SCY' AND swimmer_id = 1
ORDER BY event_date DESC
LIMIT 5;
-- Expected: All calculated_standard values should be populated (not null)
```

## Root Cause Analysis

### Why This Happened
1. **CSV Import Issue**: The CSV was likely imported without validating the column order
2. **No Validation**: No checks to ensure AAAA < AAA < AA < A < BB < B for Girls events
3. **Schema Mismatch**: Function definitions didn't match table schema
4. **Hardcoded Assumptions**: Age and gender were hardcoded instead of parameterized

### Prevention for Future
1. Add CHECK constraints to time_standards table:
   ```sql
   ALTER TABLE time_standards ADD CONSTRAINT check_time_order
   CHECK (
      (gender = 'Girls' AND aaaa_standard < aaa_standard AND aaa_standard < aa_standard
       AND aa_standard < a_standard AND a_standard < bb_standard AND bb_standard < b_standard)
      OR
      (gender = 'Boys')  -- Boys standards can vary by event
   );
   ```
2. Add unit tests for time standard calculations
3. Document the expected data format in the schema
4. Add gender as a required field for swimmers

## Impact

### Before Fix
- ❌ 50 FL SCY times showing as "BB" when they were actually "B"
- ❌ All calculated_standard values showing as NULL in views
- ❌ No gap calculations working
- ❌ No next target information available

### After Fix (When SQL is executed)
- ✅ Correct time standard classification (B, BB, A, AA, AAA, AAAA)
- ✅ Dynamic calculation based on actual time_standards table
- ✅ Accurate gap calculations showing seconds needed to improve
- ✅ Next target information for goal setting
- ✅ Works for all ages, genders, and course types
- ✅ No more hardcoded values

## Files Created

1. `/scripts/fix_reversed_time_standards.sql` - SQL version of the swap
2. `/scripts/fix_time_standards_via_api.sh` - ✅ Executed successfully
3. `/scripts/fix_standard_calculation_functions.sql` - Function fixes only
4. `/scripts/complete_fix_all_calculations.sql` - ⭐ **COMPLETE FIX (USE THIS)**
5. `/TIME_STANDARDS_FIX_SUMMARY.md` - This document

## Next Steps

1. Execute `/scripts/complete_fix_all_calculations.sql` via Supabase Dashboard
2. Verify the calculations work correctly
3. Update the competition_results.time_standard column where needed
4. Test the web application to ensure charts show correct data
5. Consider adding data validation constraints
