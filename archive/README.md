# Time Standards Database Setup

This directory contains scripts to load USA Swimming Motivational Time Standards (2024-2028) into Supabase.

## Overview

The time standards data includes:
- **5 Age Groups**: 10 & under, 11-12, 13-14, 15-16, 17-18
- **3 Course Types**: SCY (Short Course Yards), SCM (Short Course Meters), LCM (Long Course Meters)
- **2 Genders**: Girls, Boys
- **6 Standard Levels**: B, BB, A, AA, AAA, AAAA
- **518 Total Records**: Covering all combinations of the above

## Files

- `recreate_table.sql` - SQL to drop old table and create new schema (⚠️ REQUIRED)
- `create_time_standards_table.sql` - SQL to create table (alternative if table doesn't exist)
- `load_time_standards.js` - Node.js script to load CSV data into Supabase
- `setup_database.js` - Check if table exists and is accessible
- `check_table_schema.js` - Inspect current table schema

## Setup Instructions

### Step 1: Recreate the Table in Supabase

The existing `time_standards` table has an outdated schema and needs to be recreated.

1. **Go to Supabase SQL Editor**:
   - Open: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
   - Or navigate: Project Dashboard → SQL Editor

2. **Execute the SQL**:
   - Open the file: `scripts/recreate_table.sql`
   - Copy the entire SQL content
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify Success**:
   - You should see a success message
   - The old table will be dropped and new table created
   - All indexes and constraints will be set up

⚠️ **WARNING**: This will delete any existing data in the `time_standards` table. The old table had a different schema (no gender/course type differentiation) and needs to be replaced.

### Step 2: Load the Time Standards Data

After the table is created, load the CSV data:

```bash
cd /Users/yhuchchannavar/Documents/vihaan-swim-tracker
node scripts/load_time_standards.js
```

The script will:
- Read `usa_swimming_standards_cleaned_all.csv`
- Parse 518 records
- Convert time formats (MM:SS.SS → seconds)
- Insert data in batches of 100
- Show progress and success/error counts

### Step 3: Verify the Data

Check that data loaded successfully:

```bash
node scripts/setup_database.js
```

## What Changed

### Old Schema
```sql
- event_name (e.g., "50 FR SCY")
- age_group (e.g., "10")
- a_time, b_time, bb_time, aa_time, aaa_time, aaaa_time
```

### New Schema
```sql
- age_group (e.g., "10 & under")
- age_group_code (e.g., "10U")
- course_type (SCY, SCM, LCM)
- gender (Girls, Boys)
- event_name (e.g., "50 FR")
- a_standard, b_standard, bb_standard, aa_standard, aaa_standard, aaaa_standard
```

### Key Improvements
1. **Gender-Specific Standards**: Girls and Boys have different time standards
2. **Course Type Separation**: SCY, SCM, and LCM standards are separate
3. **Consistent Event Names**: Events no longer include course type in name
4. **Better Age Groups**: Full age group names (e.g., "10 & under" instead of "10")
5. **Unique Constraints**: Prevent duplicate standards for same age/gender/course/event

## Querying the Data

Example queries:

```javascript
// Get standards for specific swimmer (10 year old girl, SCY events)
const { data } = await supabase
  .from('time_standards')
  .select('*')
  .eq('age_group_code', '10U')
  .eq('gender', 'Girls')
  .eq('course_type', 'SCY')
  .eq('event_name', '50 FR');

// Get all events for age group
const { data } = await supabase
  .from('time_standards')
  .select('event_name, a_standard, aa_standard')
  .eq('age_group_code', '11-12')
  .eq('gender', 'Boys')
  .eq('course_type', 'SCY');
```

## Troubleshooting

### Table Already Exists Error
If you get an error that the table already exists, use `recreate_table.sql` which drops and recreates it.

### Permission Errors
Make sure you're using the Supabase SQL Editor with proper admin permissions. The REST API doesn't support DDL operations.

### Loading Errors
If data loading fails:
1. Verify the table was created correctly
2. Check CSV file path is correct
3. Review error messages for specific issues
4. Ensure Supabase connection is working

## Next Steps

After loading the data, update the application code to:
1. Query time standards based on swimmer's age, gender, and course type
2. Update time standard calculations to use gender-aware lookups
3. Support all course types (SCY, SCM, LCM)
4. Display all standard levels (B, BB, A, AA, AAA, AAAA)
