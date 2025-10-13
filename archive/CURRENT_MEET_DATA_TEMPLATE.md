# Current Meet Data - Template

## Meet Information (FILL THIS OUT FIRST!)

**Meet Name**: `________________________________`
**Meet Date(s)**: `________________________________`
**Course Type**: `[ ] SCY  [ ] SCM  [ ] LCM`
**Location/LSC**: `LAC-NT` (from screenshots)
**Swimmer**: Vihaan Huchchannavar (Age 10)
**Swimmer ID**: `________` (run SQL query to get this)

## Query to Get Swimmer ID

```sql
-- Run this in Supabase SQL Editor first:
SELECT id, full_name, current_age
FROM swimmers
WHERE full_name LIKE '%Vihaan%' AND active = true;
```

---

## Extracted Data from Screenshots

| Event # | Event Description | Database Format | Time (formatted) | Time (seconds) | Place | Time Improvement | Notes |
|---------|-------------------|-----------------|------------------|----------------|-------|------------------|-------|
| 10 | Boys 10&U 50 Yard Fly | 50 FL SCY | 41.63 | 41.63 | 2 | -0.71 | Finals 0-10, Completed |
| 18 | Boys 10&U 100 Yard Free | 100 FR SCY | 1:14.72 | 74.72 | 1 | -5.39 | Finals 0-10, Completed |
| 26 | Boys 10&U 500 Yard Free | 500 FR SCY | 7:20.72 | 440.72 | 3 | - | Finals 0-10, Completed |
| 46 | Boys 10&U 200 Yard Free | 200 FR SCY | 2:46.56 | 166.56 | 1 | -6.41 | Finals 0-10, Completed |
| 58 | Boys 10&U 100 Yard Fly | 100 FL SCY | 1:37.56 | 97.56 | 1 | - | Finals 0-10, Completed |
| 70 | Boys 10&U 200 Yard IM | 200 IM SCY | 3:09.73 | 189.73 | 2 | - | Finals 0-10, Completed |

---

## Time Conversion Reference

| Time Formatted | Calculation | Time in Seconds |
|----------------|-------------|-----------------|
| 41.63 | 41.63 | 41.63 |
| 1:14.72 | 60 + 14.72 | 74.72 |
| 1:37.56 | 60 + 37.56 | 97.56 |
| 2:46.56 | (2×60) + 46.56 | 166.56 |
| 3:09.73 | (3×60) + 9.73 | 189.73 |
| 7:20.72 | (7×60) + 20.72 | 440.72 |

---

## Analysis & Observations

### Personal Bests Check

Compare these times with existing data in `data/event_times.csv`:

| Event | Current Time | Previous Best | Is PB? | Improvement |
|-------|-------------|---------------|--------|-------------|
| 50 FL SCY | 41.63 | 42.34 (Jul 11) | ✅ YES | -0.71 sec |
| 100 FR SCY | 1:14.72 | 1:20.11 (Jul 13) | ✅ YES | -5.39 sec |
| 500 FR SCY | 7:20.72 | - | ? | First time |
| 200 FR SCY | 2:46.56 | 2:45.08 (Oct 4) | ❌ NO | +1.48 sec |
| 100 FL SCY | 1:37.56 | 1:40.26 (Oct 4) | ✅ YES | -2.70 sec |
| 200 IM SCY | 3:09.73 | 3:06.13 (Oct 3) | ❌ NO | +3.60 sec |

**Summary:**
- ✅ **4 Personal Bests**: 50 FL, 100 FR, 100 FL, possibly 500 FR
- ❌ **2 Slower**: 200 FR (+1.48), 200 IM (+3.60)
- 🆕 **1 New Event**: 500 FR (first recorded time)

### Time Standards Prediction

Based on existing time_standards data (approximate):

| Event | Time | Expected Standard | Gap to Next |
|-------|------|-------------------|-------------|
| 50 FL SCY | 41.63 | ~B/BB | Check database |
| 100 FR SCY | 1:14.72 | ~B/BB | Check database |
| 500 FR SCY | 7:20.72 | ~? | Check database |
| 200 FR SCY | 2:46.56 | ~BB | Check database |
| 100 FL SCY | 1:37.56 | ~B | Check database |
| 200 IM SCY | 3:09.73 | ~BB | Check database |

---

## Next Steps

1. **Fill out meet information** at the top
2. **Get swimmer_id** from database
3. **Open** `scripts/insert_new_meet_results.sql`
4. **Replace placeholders**:
   - `<SWIMMER_ID>` → actual ID
   - `MEET_NAME_HERE` → actual meet name
   - `2025-10-XX` → actual date(s)
5. **Review** the SQL statements
6. **Execute** in Supabase SQL Editor
7. **Verify** data was inserted correctly
8. **Check views** for calculated standards and personal bests

---

## Questions to Answer

Before running the INSERT:

- [ ] What is the meet name?
- [ ] What are the event date(s)?
- [ ] Is the course type SCY, SCM, or LCM?
- [ ] What is Vihaan's swimmer_id in the database?
- [ ] Are there any other events not visible in screenshots?
- [ ] Should points be updated from 0 to actual values?

---

## Database Tables Schema Quick Reference

### competition_results
```sql
- id (primary key)
- swimmer_id (foreign key → swimmers.id)
- event_name (e.g., "50 FL SCY")
- meet_name (full meet name)
- event_date (date)
- time_formatted (e.g., "1:14.72")
- time_seconds (decimal, e.g., 74.72)
- course_type (SCY/SCM/LCM)
- distance (integer, e.g., 50, 100, 200)
- stroke (FR/BK/BR/FL/IM)
- time_standard (nullable, calculated by view)
- points (integer)
- lsc (e.g., "LAC-NT")
- team (e.g., "LAC-NT")
- age (integer)
- notes (text)
```

### Event Name Format
`{distance} {stroke} {course}`

Examples:
- 50 FR SCY (50 yards freestyle, short course yards)
- 100 BK LCM (100 meters backstroke, long course meters)
- 200 IM SCY (200 yards individual medley, short course yards)

---

## Backup: CSV Export Format

If you prefer to work with CSV first, use this format:

```csv
Event,Date,Time,Time Standard,Meet,Points,Age
50 FL SCY,YYYY-MM-DD,41.63,,MEET_NAME,0,10
100 FR SCY,YYYY-MM-DD,1:14.72,,MEET_NAME,0,10
500 FR SCY,YYYY-MM-DD,7:20.72,,MEET_NAME,0,10
200 FR SCY,YYYY-MM-DD,2:46.56,,MEET_NAME,0,10
100 FL SCY,YYYY-MM-DD,1:37.56,,MEET_NAME,0,10
200 IM SCY,YYYY-MM-DD,3:09.73,,MEET_NAME,0,10
```

Then use the app's CSV upload feature or convert to SQL INSERT statements.
