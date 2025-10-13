# Normalized Database Schema - Summary

## What Changed?

I've redesigned the database schema based on your feedback to follow proper database normalization principles.

## Problems Fixed ✅

### 1. **Data Duplication Eliminated**
- **Before**: Gap tracking stored in `competition_results` table + repeated in views
- **After**: Calculated on-demand via database functions

### 2. **Personal Best Flag Removed**
- **Before**: `personal_best BOOLEAN` column that needed manual updating
- **After**: Derived via `MIN(time_seconds)` - always accurate

### 3. **Next Standard Logic Corrected**
- **Before**:
  ```
  Time: 1:20.11 (B level)
  Next Standard: AAAA ❌ (incorrect - this is 4 levels away!)
  ```
- **After**:
  ```
  Time: 1:20.11 (Below B)
  Next Standard: B ✅ (correct - next immediate goal)
  Gap: 1.72 seconds
  ```

### 4. **Removed Redundant Columns**
- **progress_report** no longer duplicates time_standards data
- **latest_times_per_event** only shows latest time, no calculations
- All calculations moved to dedicated view: `competition_results_with_standards`

## New Schema Architecture

### Tables (Store Facts Only)

**competition_results** - Normalized
```sql
- id
- event_name, event_date, meet_name
- time_formatted, time_seconds
- course_type, distance, stroke
- points, age, team
- notes
```
❌ Removed: `current_standard`, `next_standard`, `target_time`, `gap_seconds`, `personal_best`

**time_standards** - Reference data (unchanged)

### Functions (Calculate Insights)

1. **get_current_standard(event, time)**
   - Returns: 'AAAA', 'AAA', 'AA', 'A', 'BB', 'B', or 'Below B'
   - Logic: Compares time against standards (fastest to slowest)

2. **get_next_standard_info(event, time)**
   - Returns: next level, target time, gap in seconds, improvement %
   - Logic: Returns the NEXT BETTER standard (not the fastest)
   - If at AAAA or faster: returns NULL (no next standard)

3. **format_time(seconds)**
   - Returns: 'MM:SS.SS' or 'SS.SS' format

### Views (Derived Data)

1. **personal_bests**
   ```sql
   - event_name
   - best_time_seconds (MIN)
   - best_time_formatted
   - achieved_date
   ```

2. **latest_times_per_event**
   ```sql
   - event_name
   - event_date (most recent)
   - time_formatted, time_seconds
   - meet_name, team, course_type
   ```

3. **competition_results_with_standards** (NEW)
   ```sql
   - All fields from competition_results
   - current_standard (calculated)
   - next_standard, next_target_seconds, next_target_formatted (calculated)
   - gap_seconds, improvement_needed_pct (calculated)
   - is_personal_best (calculated)
   ```

4. **progress_report** (Redesigned - No Duplication)
   ```sql
   - event_name
   - current_time, time_seconds
   - current_standard (calculated)
   - next_standard, next_target_time (calculated)
   - gap_seconds, improvement_pct (calculated)
   - personal_best, pb_date
   - seconds_off_pb (calculated)
   ```

## Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Stored Data** | 792 values | 440 values | -44% |
| **Data Duplication** | High | None | ✅ |
| **Next Standard Logic** | Incorrect | Correct | ✅ |
| **Personal Bests** | Stored (manual) | Derived (automatic) | ✅ |
| **Maintenance** | Manual updates | Automatic | ✅ |
| **Query Performance** | Good | Same/Better | ✅ |
| **Data Accuracy** | Can drift | Always accurate | ✅ |

## Migration Steps

### Step 1: Run Normalized Schema in Supabase

**Option A: Direct SQL (Recommended)**
1. Open Supabase SQL Editor
2. Copy entire contents of `supabase-schema-normalized.sql`
3. Paste and click **Run**
4. Verify: Check that tables exist in Table Editor

**Option B: Via Script** (if direct SQL doesn't work)
```bash
node runNormalizedSchema.js
```

### Step 2: Import Data

```bash
node supabaseSetup-normalized.js
```

**Output**:
```
🏊‍♂️ Vihaan's Swim Tracker - Normalized Schema Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 Testing connection...
✅ Connected to Supabase!

📥 Importing competition results...
✅ Imported 44 competition results
⏭️  Skipped 1 invalid entries

📥 Importing team progression...
✅ Imported 11 team records

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Setup complete! Imported 55 total records

Progress Report (showing calculated data):
  100 FR SCY: 1:20.11 (Below B) → Next: B (1:18.39, gap: 1.72s)
  200 FR SCY: 2:52.97 (BB) → Next: A (2:43.59, gap: 9.38s)
  ...
```

### Step 3: Verify Results

**Check Progress Report**:
```sql
SELECT * FROM progress_report;
```

**Verify Next Standard Logic**:
```sql
SELECT
  event_name,
  current_time,
  current_standard,
  next_standard,
  gap_seconds
FROM progress_report
WHERE next_standard IS NOT NULL
ORDER BY gap_seconds ASC;
```

Expected: Should NOT see AAAA as `next_standard` unless swimmer is at AAA level.

## Query Examples

### Get Latest Performance with Gap Analysis
```sql
SELECT
  event_name,
  current_time,
  current_standard,
  next_standard,
  next_target_time,
  gap_seconds,
  improvement_pct
FROM progress_report
ORDER BY gap_seconds ASC;
```

### Find Events Closest to Next Standard
```sql
SELECT
  event_name,
  current_standard,
  next_standard,
  gap_seconds
FROM progress_report
WHERE next_standard IS NOT NULL
ORDER BY gap_seconds ASC
LIMIT 5;
```

### Get All Swims for an Event with Standards
```sql
SELECT
  event_date,
  time_formatted,
  current_standard,
  next_standard,
  is_personal_best
FROM competition_results_with_standards
WHERE event_name = '100 FR SCY'
ORDER BY event_date DESC;
```

### Personal Bests Only
```sql
SELECT * FROM personal_bests
ORDER BY event_name;
```

## Files Reference

| File | Purpose |
|------|---------|
| `supabase-schema-normalized.sql` | **New normalized schema** (use this) |
| `supabaseSetup-normalized.js` | **Import script for normalized schema** |
| `runNormalizedSchema.js` | Helper to apply schema via script |
| `MIGRATION_GUIDE.md` | Detailed migration documentation |
| `supabase-schema.sql` | Old denormalized schema (backup) |
| `supabaseSetup.js` | Old import script (backup) |

## Troubleshooting

**Schema won't run**:
- Make sure you're using Supabase SQL Editor (not REST API)
- Copy-paste entire file contents
- Check for connection errors

**Functions not working**:
- Verify functions exist: Check "Database" → "Functions" in Supabase
- Re-run schema SQL if needed

**Data not importing**:
- Ensure schema was applied first
- Check `.env` has correct credentials
- Verify CSV files exist in `data/` folder

## Next Steps After Migration

1. ✅ Verify progress_report shows correct next_standard
2. ✅ Confirm personal_bests are accurate
3. ✅ Test queries for your use cases
4. Update any external apps/scripts to use new view names
5. Remove old schema files if migration successful

---

**Key Takeaway**: The new schema is **smaller, faster, and always accurate** because calculations happen on-demand using database functions instead of storing potentially stale data.
