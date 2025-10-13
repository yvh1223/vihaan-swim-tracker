# Screenshot Processing Guide

## Overview

This guide explains how to extract swim meet data from mobile app screenshots and insert it into the Supabase database.

## Required Information

Before processing screenshots, gather this information:

### From Screenshots ✅
- Event names (e.g., "Boys 10&U 50 Yard Fly")
- Times (formatted as MM:SS.SS)
- Place/Rank
- Time improvements (if shown)
- Event numbers (optional)

### From External Sources ⚠️
**You MUST provide these manually** (not visible in screenshots):
1. **Meet Name** - Full name of the competition
2. **Event Date(s)** - Actual date(s) when events took place
3. **Course Type** - SCY (Short Course Yards), SCM (Short Course Meters), or LCM (Long Course Meters)
4. **Swimmer ID** - The database ID from the `swimmers` table

## Processing Steps

### Step 1: Extract Data from Screenshots

Create a table like this from the screenshots:

| Event # | Event Name | Time | Place | Time Improvement | Notes |
|---------|------------|------|-------|------------------|-------|
| 10 | Boys 10&U 50 Yard Fly | 41.63 | 2 | -0.71 | Finals 0-10 |
| 18 | Boys 10&U 100 Yard Free | 1:14.72 | 1 | -5.39 | Finals 0-10 |
| 26 | Boys 10&U 500 Yard Free | 7:20.72 | 3 | - | Finals 0-10 |
| 46 | Boys 10&U 200 Yard Free | 2:46.56 | 1 | -6.41 | Finals 0-10 |
| 58 | Boys 10&U 100 Yard Fly | 1:37.56 | 1 | - | Finals 0-10 |
| 70 | Boys 10&U 200 Yard IM | 3:09.73 | 2 | - | Finals 0-10 |

### Step 2: Standardize Event Names

Convert descriptive names to database format:

| From Screenshot | Database Format |
|----------------|----------------|
| Boys 10&U 50 Yard Fly | 50 FL SCY |
| Boys 10&U 100 Yard Free | 100 FR SCY |
| Boys 10&U 200 Yard Free | 200 FR SCY |
| Boys 10&U 500 Yard Free | 500 FR SCY |
| Boys 10&U 100 Yard Fly | 100 FL SCY |
| Boys 10&U 200 Yard IM | 200 IM SCY |

**Stroke Codes:**
- FR = Freestyle
- BK = Backstroke
- BR = Breaststroke
- FL = Butterfly (Fly)
- IM = Individual Medley

**Course Codes:**
- SCY = Short Course Yards (25 yards)
- SCM = Short Course Meters (25 meters)
- LCM = Long Course Meters (50 meters)

### Step 3: Convert Times to Seconds

The database stores times in seconds as decimal numbers:

```
Format: MM:SS.SS or SS.SS

Examples:
- 41.63 → 41.63 seconds (no conversion needed)
- 1:14.72 → 60 + 14.72 = 74.72 seconds
- 1:37.56 → 60 + 37.56 = 97.56 seconds
- 2:46.56 → 120 + 46.56 = 166.56 seconds
- 3:09.73 → 180 + 9.73 = 189.73 seconds
- 7:20.72 → 420 + 20.72 = 440.72 seconds

Formula:
time_seconds = (minutes × 60) + seconds
```

### Step 4: Look Up Swimmer ID

Run this SQL in Supabase SQL Editor:

```sql
SELECT id, full_name, current_age
FROM swimmers
WHERE full_name LIKE '%Vihaan%'  -- Adjust name as needed
  AND active = true;
```

Note the `id` value - you'll need it for the INSERT statements.

### Step 5: Create INSERT Statements

Use the template in `insert_new_meet_results.sql` and replace:

1. `<SWIMMER_ID>` with the ID from Step 4
2. `'MEET_NAME_HERE'` with the actual meet name
3. `'2025-10-XX'` with the actual event date(s)
4. Verify course_type (SCY, SCM, or LCM)

### Step 6: Execute SQL

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
2. Paste your modified INSERT statements
3. Run the query
4. Verify results with the SELECT query at the end

## Handling Multiple Screenshots

When you have multiple screenshots from the same page:

1. **Avoid Duplicates**: Check event numbers - if an event appears in multiple screenshots, only include it once
2. **Order Events**: Process events in chronological order if they span multiple days
3. **Scroll Indicators**: Look for visual indicators (scroll position, "page X of Y") to understand overlap

### Example: Screenshot Overlap Detection

```
Screenshot 1 shows:
- Event 10: 50 FL
- Event 18: 100 FR
- Event 26: 500 FR
- Event 46: 200 FR (partial view at bottom)

Screenshot 2 shows:
- Event 18: 100 FR (duplicate - SKIP)
- Event 26: 500 FR (duplicate - SKIP)
- Event 46: 200 FR (full view - USE)
- Event 58: 100 FL (new)
- Event 70: 200 IM (new)
```

**Action**: Only insert Events 10, 18, 26, 46 (full), 58, and 70 (skip duplicates from Screenshot 1)

## Data Validation Checklist

Before running the INSERT:

- [ ] All times converted to seconds correctly
- [ ] Event names match database format (e.g., "50 FL SCY")
- [ ] Course type is correct (SCY/SCM/LCM)
- [ ] Swimmer ID is correct
- [ ] Meet name and date are accurate
- [ ] No duplicate events from multiple screenshots
- [ ] Distance and stroke fields populated correctly

## Common Issues & Solutions

### Issue: Time Standard Not Showing

**Cause**: The `time_standard` field in screenshots may be blank or not match database values.

**Solution**: Leave `time_standard` as `NULL` in INSERT statements. The database view `competition_results_with_standards` will automatically calculate the correct standard based on:
- Age
- Gender
- Event
- Course type
- Time

### Issue: Points Show as 0

**Cause**: Some meets don't award points, or points are tracked separately.

**Solution**: Enter `0` for points if not shown in screenshots. This is normal and doesn't affect time standards or personal bests.

### Issue: Multiple Dates for Same Meet

**Cause**: Multi-day meets have different events on different dates.

**Solution**: Look for date indicators in the app or use the meet schedule to assign correct dates to each event.

### Issue: Screenshot Cuts Off Information

**Solution**: Take multiple screenshots ensuring:
1. Full event information visible
2. Some overlap between screenshots for context
3. Scroll position indicators visible
4. All key data (time, place, event name) fully shown

## Future Screenshot Processing

For future meets, follow this workflow:

1. **Take Screenshots**: Capture all events, ensuring no data is cut off
2. **Extract Data**: Create spreadsheet with all event details
3. **Gather Context**: Get meet name, dates, course type
4. **Look Up Swimmer**: Get swimmer_id from database
5. **Generate SQL**: Use template and replace placeholders
6. **Execute**: Run in Supabase SQL Editor
7. **Verify**: Check data with SELECT queries
8. **Update CSV Backup** (optional): Add new data to `/data/event_times.csv`

## Time Standards Reference

The database will automatically calculate standards based on USA Swimming 2024-2028 Motivational Time Standards:

- **AAAA**: Top tier
- **AAA**: National level
- **AA**: Sectional level
- **A**: Regional level
- **BB**: Above average
- **B**: Base standard
- **Slower than B**: Below base standard

Standards vary by:
- Age group (10U, 11-12, 13-14, 15-16, 17-18)
- Gender (Boys/Girls)
- Course type (SCY/SCM/LCM)
- Event

## Example: Complete Processing Workflow

**Scenario**: Processing screenshots from "2025 NT LAC Fall Classic"

**Step-by-Step:**

1. Screenshots show 4 events from October 13, 2025
2. Extract data:
   - 50 FR - 34.52 - Place 1
   - 100 BK - 1:22.15 - Place 2
   - 200 IM - 3:05.48 - Place 1
   - 100 FL - 1:35.21 - Place 3

3. Look up swimmer_id: `42` (example)

4. Create INSERT:
```sql
INSERT INTO competition_results (
    swimmer_id, event_name, meet_name, event_date,
    time_formatted, time_seconds, course_type, ...
) VALUES
    (42, '50 FR SCY', '2025 NT LAC Fall Classic', '2025-10-13', '34.52', 34.52, 'SCY', ...),
    (42, '100 BK SCY', '2025 NT LAC Fall Classic', '2025-10-13', '1:22.15', 82.15, 'SCY', ...),
    (42, '200 IM SCY', '2025 NT LAC Fall Classic', '2025-10-13', '3:05.48', 185.48, 'SCY', ...),
    (42, '100 FL SCY', '2025 NT LAC Fall Classic', '2025-10-13', '1:35.21', 95.21, 'SCY', ...);
```

5. Execute in Supabase SQL Editor
6. Verify with SELECT query
7. Check personal bests and standards in views

## Tools & Resources

- **Supabase SQL Editor**: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
- **Time Converter**: Use calculator or spreadsheet: `=(MINUTES*60)+SECONDS`
- **Event Name Reference**: See `data/event_times.csv` for examples
- **USA Swimming Standards**: https://www.usaswimming.org/times/motivational-times

## Questions?

If you encounter issues:

1. Check existing data in `competition_results` table for format examples
2. Review CSV files in `/data/` folder for reference
3. Verify swimmer_id exists in `swimmers` table
4. Ensure time_standards table has data for the age group, gender, course, and event
