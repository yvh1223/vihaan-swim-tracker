# 📸 Screenshot Data Import - Quick Start Guide

## What You Have

From your screenshots, you have **6 new swim results** for Vihaan:

| Event | Time | Place | Notes |
|-------|------|-------|-------|
| 50 FL SCY | 41.63 | 2nd | Time improvement: -0.71 |
| 100 FR SCY | 1:14.72 | 1st | Time improvement: -5.39 |
| 500 FR SCY | 7:20.72 | 3rd | Finals |
| 200 FR SCY | 2:46.56 | 1st | Time improvement: -6.41 |
| 100 FL SCY | 1:37.56 | 1st | Finals |
| 200 IM SCY | 3:09.73 | 2nd | Finals |

## 🎯 Quick Import Process

### Step 1: Gather Meet Information ⚠️ REQUIRED

You need to provide (not visible in screenshots):
- **Meet Name**: Full competition name
- **Meet Date(s)**: Actual date(s) when events happened
- **Course Type**: SCY (Short Course Yards) - *assumed based on "Yard" in event names*

### Step 2: Run Schema Verification

```bash
# Open Supabase SQL Editor
# Paste and run: scripts/verify_schema.sql
```

This will check:
- ✅ All required tables exist
- ✅ Time standards are loaded (should show ~518 records)
- ✅ Swimmers table has Vihaan's record
- ✅ Database is ready for import

### Step 3: Get Swimmer ID

```sql
-- Run in Supabase SQL Editor:
SELECT id, full_name, current_age
FROM swimmers
WHERE full_name LIKE '%Vihaan%' AND active = true;
```

**Note the `id` value** - you'll need it!

### Step 4: Prepare INSERT Statements

1. **Open**: `scripts/insert_new_meet_results.sql`
2. **Replace**:
   - `<SWIMMER_ID>` → (ID from Step 3)
   - `MEET_NAME_HERE` → (Actual meet name)
   - `2025-10-XX` → (Actual date(s))
3. **Review**: All 6 INSERT statements

### Step 5: Execute in Supabase

1. Go to: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
2. Paste your modified SQL
3. Click "Run"
4. Verify results with SELECT query at end

### Step 6: Verify Data

The database views will automatically:
- ✅ Calculate time standards (B, BB, A, AA, etc.)
- ✅ Identify personal bests
- ✅ Calculate gaps to next standards
- ✅ Update progress charts

## 📁 Files Created for You

### Core Files

1. **`scripts/insert_new_meet_results.sql`**
   - Ready-to-use INSERT statements for your 6 events
   - Just replace placeholders and run

2. **`scripts/verify_schema.sql`**
   - Comprehensive database health check
   - Validates all tables and data

3. **`scripts/SCREENSHOT_PROCESSING_GUIDE.md`**
   - Complete guide for future screenshot processing
   - Includes troubleshooting and best practices

4. **`scripts/CURRENT_MEET_DATA_TEMPLATE.md`**
   - Pre-filled template for your current data
   - Shows time conversions and analysis

### Reference Files

5. **`PROJECT_STATUS.md`** (already exists)
   - Complete database architecture documentation
   - Status of all tables and setup

## 📊 Data Analysis Preview

### Personal Bests Check (vs existing data)

Based on `/data/event_times.csv`:

| Event | New Time | Previous Best | Result |
|-------|----------|---------------|--------|
| 50 FL SCY | 41.63 | 42.34 | ✅ **PB** (-0.71) |
| 100 FR SCY | 1:14.72 | 1:20.11 | ✅ **PB** (-5.39) |
| 500 FR SCY | 7:20.72 | - | 🆕 **First time** |
| 200 FR SCY | 2:46.56 | 2:45.08 | ❌ Slower (+1.48) |
| 100 FL SCY | 1:37.56 | 1:40.26 | ✅ **PB** (-2.70) |
| 200 IM SCY | 3:09.73 | 3:06.13 | ❌ Slower (+3.60) |

**Summary**: 4 Personal Bests + 1 New Event! 🎉

### Time Standards (Approximate)

The database will calculate exact standards, but based on pattern:
- **50 FL**: Likely B or BB standard
- **100 FR**: Likely B or BB standard
- **500 FR**: Need to check against standards
- **200 FR**: Likely BB standard (previous was BB)
- **100 FL**: Likely B standard
- **200 IM**: Likely BB standard (previous was BB)

## ⚠️ Important Notes

### Database Schema - No Changes Needed! ✅

Your current `competition_results` table is perfect for this data. All required fields exist:
- ✅ swimmer_id, event_name, meet_name, event_date
- ✅ time_formatted, time_seconds
- ✅ course_type, distance, stroke
- ✅ time_standard (auto-calculated)
- ✅ points, lsc, team, age
- ✅ notes

### Screenshot Processing Best Practices

✅ **DO:**
- Take multiple overlapping screenshots for safety
- Verify event names match database format
- Convert times to seconds correctly
- Fill in meet context (name, date) from external sources
- Check for duplicates when processing multiple screenshots

❌ **DON'T:**
- Skip gathering meet name and date
- Include duplicate events from overlapping screenshots
- Forget to convert MM:SS.SS format to decimal seconds
- Mix up course types (SCY vs LCM)

## 🔄 Future Screenshot Processing

For next time, follow these steps:

1. **Take Screenshots**: Capture all event data
2. **Fill Template**: Use `CURRENT_MEET_DATA_TEMPLATE.md`
3. **Run Verification**: Use `verify_schema.sql`
4. **Generate SQL**: Use `insert_new_meet_results.sql` template
5. **Execute**: Run in Supabase SQL Editor
6. **Verify**: Check results and views

## 📚 Additional Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp
- **SQL Editor**: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql
- **Time Standards**: Loaded from `usa_swimming_standards_cleaned_all.csv`
- **Event Data Reference**: See `/data/event_times.csv` for format examples

## 🆘 Troubleshooting

### Issue: Swimmer ID not found
**Solution**: Check if Vihaan exists in `swimmers` table. If not, create swimmer record first.

### Issue: Time standard not calculated
**Solution**: Verify `time_standards` table has data for Age 10, Boys, SCY course. Run `verify_schema.sql`.

### Issue: Duplicate event error
**Solution**: Check if event already exists for same meet/date. Either update or skip duplicate.

### Issue: Meet name unknown
**Solution**: Check meet schedule, confirmation email, or USA Swimming database for official meet name.

## ✅ Checklist Before Import

- [ ] Meet name confirmed
- [ ] Event date(s) confirmed
- [ ] Course type verified (SCY/SCM/LCM)
- [ ] Swimmer ID retrieved from database
- [ ] All 6 events reviewed and verified
- [ ] No duplicate events in database
- [ ] SQL statements updated with real data
- [ ] Ready to execute in Supabase

## 🎉 After Import

Once imported, the web app will automatically show:
- Updated progress charts
- New personal bests highlighted
- Time standard achievements
- Gaps to next standards
- Historical progression

Just refresh the app at http://localhost:8000 (or your deployed URL)!

---

## Need Help?

All documentation files are in the `scripts/` folder:
- Detailed processing guide
- Schema verification
- INSERT templates
- Examples and references

**Current Status**: Your database schema is ready. Just need to:
1. Get meet context (name, date)
2. Get swimmer_id
3. Run the INSERT statements

Good luck! 🏊‍♂️💨
