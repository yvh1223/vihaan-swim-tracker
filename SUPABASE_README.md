# Vihaan's Swim Tracker - Supabase Database

Complete PostgreSQL database setup for tracking swimming performance with automatic gap analysis.

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Supabase Project

1. Go to **https://supabase.com**
2. Click **"Start your project"** (FREE!)
3. Sign in with GitHub
4. Click **"New project"**
5. Enter:
   - **Name**: `vihaan-swim-tracker`
   - **Database Password**: (create strong password)
   - **Region**: Choose closest to you
6. Click **"Create new project"**
7. Wait ~2 minutes

### Step 2: Get Credentials

1. In your project, go to **Settings** → **API**
2. Copy these 3 values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: (click copy)
   - **service_role**: (click "Reveal" then copy)

### Step 3: Configure .env

```bash
cd ~/Documents/vihaan-swim-tracker
cp .env.example .env
nano .env
```

Paste your actual values:
```env
SUPABASE_URL=https://your-actual-project.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

Save and exit (Ctrl+X, Y, Enter)

### Step 4: Run Schema SQL

1. In Supabase, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `supabase-schema.sql` file
4. Copy ALL contents (Cmd+A, Cmd+C)
5. Paste into SQL Editor
6. Click **"Run"** (or Ctrl+Enter)
7. Should see: **"Success. No rows returned"**

This creates:
- ✅ 5 tables (competitions, practices, goals, teams, standards)
- ✅ USA Swimming time standards (preloaded!)
- ✅ 3 views for common queries
- ✅ Automatic timestamp updates

### Step 5: Import Your Data

```bash
node supabaseSetup.js
```

Output:
```
🏊‍♂️ Vihaan's Swim Tracker - Supabase Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 Testing connection...
✅ Connected to Supabase!

📥 Importing competition results...
✅ Imported 46 competition results
⏭️  Skipped 0 invalid entries

🏆 Updating personal bests...
✅ Personal bests updated

📥 Importing team progression...
✅ Imported 11 team records

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Setup complete! Imported 57 total records
```

## 📊 What You Get

### Tables

1. **competition_results** (46 records)
   - All swim meet performances
   - Automatic gap tracking (current → next standard)
   - Personal best flags
   - Time in seconds for analytics

2. **practice_sessions** (ready for logging)
   - Date, duration, distance
   - Focus areas, intensity
   - Coach feedback
   - Energy levels

3. **improvement_goals** (ready for setting)
   - Current vs target times
   - Progress percentage
   - Priority and status
   - Action steps

4. **team_progression** (11 records)
   - Historical team timeline
   - CORE → CA → YMCA → LAC
   - Duration at each level

5. **time_standards** (11 events x 6 standards = 66 rows)
   - USA Swimming Age 10 standards
   - AAAA, AAA, AA, A, BB, B times
   - For all events

### Pre-Built Views

**latest_times_per_event**
```sql
SELECT * FROM latest_times_per_event;
```
Shows most recent time for each event with gap tracking.

**personal_bests**
```sql
SELECT * FROM personal_bests;
```
Best time ever for each event.

**progress_report**
```sql
SELECT * FROM progress_report;
```
Current time vs all standards with gaps.

## 🔍 Quick Queries

### View All Competition Results
```sql
SELECT
  event_name,
  event_date,
  time_formatted,
  current_standard,
  next_standard,
  gap_seconds
FROM competition_results
ORDER BY event_date DESC
LIMIT 10;
```

### Events Closest to Next Standard
```sql
SELECT
  event_name,
  time_formatted,
  current_standard,
  next_standard,
  gap_seconds,
  improvement_needed_pct
FROM latest_times_per_event
WHERE next_standard IS NOT NULL
ORDER BY gap_seconds ASC;
```

### Progress in Last 3 Months
```sql
SELECT
  event_name,
  MIN(time_seconds) as best_time,
  COUNT(*) as races_swum
FROM competition_results
WHERE event_date >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY event_name
ORDER BY event_name;
```

### Add New Result (via JavaScript)
```javascript
const { supabase } = require('./supabaseSetup');

const { data, error } = await supabase
  .from('competition_results')
  .insert({
    event_name: '50 FR SCY',
    event_date: '2025-10-20',
    time_formatted: '34.00',
    time_seconds: 34.00,
    current_standard: 'A',
    next_standard: 'AA',
    target_time: '30.99',
    gap_seconds: 3.01,
    meet_name: 'Fall Championships',
    team: 'LAC',
    age: 10
  });
```

## 📱 Access Supabase Dashboard

1. Go to: https://app.supabase.com
2. Select your project
3. Use these sections:
   - **Table Editor**: View/edit data
   - **SQL Editor**: Run queries
   - **Database**: See schema
   - **API Docs**: Auto-generated API

## 🎯 Key Features

✅ **Gap Tracking**: Automatic calculation to next standard
✅ **Personal Bests**: Auto-marked for each event
✅ **Time Standards**: USA Swimming Age 10 preloaded
✅ **PostgreSQL**: Full SQL power
✅ **REST API**: Auto-generated endpoints
✅ **Real-time**: Subscribe to data changes
✅ **Backups**: Daily automatic backups
✅ **Free Tier**: 500MB database + 2GB bandwidth

## 🆘 Troubleshooting

**Connection Error**:
- Check `.env` file exists and has correct values
- Verify `SUPABASE_URL` is correct
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is the secret key (not anon)

**Schema Not Found**:
- Go to SQL Editor in Supabase
- Run `supabase-schema.sql` file
- Check for any error messages

**Import Failed**:
- Make sure `data/event_times.csv` exists
- Check file has data (not empty)
- Verify CSV format matches expected columns

## 📚 Files in This Folder

- **supabase-schema.sql**: Complete database schema
- **supabaseSetup.js**: Import script
- **timeStandards.js**: USA Swimming standards calculator
- **.env.example**: Configuration template
- **SUPABASE_README.md**: This file

## 🔗 Resources

- Supabase Docs: https://supabase.com/docs
- JavaScript Client: https://supabase.com/docs/reference/javascript/introduction
- SQL Tutorial: https://www.postgresql.org/docs/current/tutorial.html

---

**Track every swim, reach every goal! 🏊‍♂️🏆**
