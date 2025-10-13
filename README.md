# Vihaan's Swim Journey Tracker

A comprehensive web application to track Vihaan's swimming journey, team progression, and event-specific performance with interactive charts and data management.

## Features

### 📊 **Overview Dashboard**
- Total meets participated
- Total events swum
- Years of swimming journey
- Monthly activity timeline

### 🏊‍♂️ **Team Progression**
- **Duration View**: Horizontal bar chart showing months spent at each team level
- **Timeline View**: Visual timeline of team progression over time
- Toggle between views with a single click
- Inclusive month calculations with annotations

### 📈 **Event Progress Charts**
- Individual charts for each swimming event (50 FR, 100 FR, 200 FR, etc.)
- Time progression tracking with color-coded time standards:
  - 🟢 **BB** (Green): Competitive level standard
  - 🔵 **B** (Blue): Intermediate level standard
  - 🟡 **A** (Yellow): Elite level standard
  - 🔴 **Below B** (Red): Needs improvement
- Automatic filtering of invalid times (DQ, Pending)

### 🎯 **Gap Analysis Charts**
Two specialized charts to track progress toward achievement goals:

#### **BB Standards Gap Analysis**
- **Purpose**: Track competitive level achievements and identify improvement targets
- **Display**: Horizontal bars showing seconds needed to achieve BB standard for each event
- **Achievement Badges**: Shows ✓BB, ✓B, or ✓A based on actual awards received at meets
- **Color**: Green gradient indicating current competitive focus
- **Logic**:
  - Displays gap bars only for events where BB has not been awarded
  - Uses absolute values to show distance regardless of current time
  - Awards based on meet results, not mathematical calculations

#### **A Standards Gap Analysis**
- **Purpose**: Track elite performance goals and long-term aspirations
- **Display**: Horizontal bars showing seconds needed to achieve A standard for each event
- **Achievement Badges**: Shows ✓A for achieved elite standards
- **Color**: Yellow/orange gradient indicating elite aspirational goals
- **Logic**:
  - Displays gap bars for all events where A has not been awarded
  - Helps visualize the path from competitive (BB) to elite (A) levels
  - Separate tracking allows focus on current achievements vs future goals

### 📋 **Data Management**
- CSV file upload for team progression data
- CSV file upload for event times data
- Download template files
- Automatic chart updates when new data is uploaded
- Data summary statistics

## File Structure

```
vihaan-swim-tracker/
├── index.html                           # Main HTML file (website)
├── css/                                 # Stylesheets
├── js/
│   ├── data.js                          # Data storage and initial datasets
│   ├── charts.js                        # Chart initialization functions
│   └── app.js                           # Main application logic
├── data/
│   ├── team_progression.csv             # Team progression raw data
│   └── event_times.csv                  # Event times raw data (includes Oct 2025 data)
├── supabase-schema-multi-swimmer.sql    # Multi-swimmer database schema (PostgreSQL)
├── supabaseSetup-multi-swimmer.js       # Multi-swimmer database import script
├── timeStandards.js                     # USA Swimming standards calculator
├── .env                                 # Supabase credentials (not in git)
└── package.json                         # Node dependencies
```

## Getting Started

### 1. Open the Application
Simply open `index.html` in any modern web browser.

### 2. Navigate Through Tabs
- **Overview**: See summary statistics and activity timeline
- **Team Progress**: View team progression with toggle between duration and timeline views
- **Event Progress**: Individual charts for each swimming event
- **Data Management**: Upload new data and manage existing data

### 3. Upload New Data

#### Team Progression Data Format:
```csv
Team,Start Date,End Date
CORE – Beginner,2021-07-01,2021-08-01
YMCA – White,2024-08-01,2024-08-31
```

#### Event Times Data Format:
```csv
Event,Date,Time,Time Standard,Meet,Points,Age
50 FR SCY,2025-07-13,35.15,B,2025 NT IRON BB/B/C Jumping Into July,336,10
100 FR SCY,2025-06-15,1:27.33,B,2025 NT STAR We Love Flip Turns Meet,80,10
```

### 4. Update Data
- Click on "Data Management" tab
- Use "Download Template" buttons to get the correct CSV format
- Upload your updated CSV files
- Charts will automatically refresh with new data

## Data Fields Explanation

### Team Progression Data
- **Team**: Name of the swim team/level
- **Start Date**: When Vihaan started at this level (YYYY-MM-DD)
- **End Date**: When Vihaan finished at this level (YYYY-MM-DD)

### Event Times Data
- **Event**: Swimming event name (e.g., "50 FR SCY", "100 IM SCY")
- **Date**: Date of the swim meet (YYYY-MM-DD)
- **Time**: Swimming time (MM:SS.SS format or SS.SS for events under 1 minute)
- **Time Standard**: Performance standard awarded at the meet (BB, B, A, or "Slower than B")
  - **Important**: Awards are NOT cumulative - receiving a B award does not mean BB was achieved
  - Standards are based on USA Swimming motivational time standards for age groups
  - Gap analysis uses these actual awards, not mathematical time comparisons
- **Meet**: Name of the swimming meet
- **Points**: Points scored (optional, can be 0)
- **Age**: Vihaan's age at the time of the event

## Technical Features

### Chart Types
- **Line Charts**: For timeline and event progression
- **Horizontal Bar Charts**: For gap analysis and duration analysis
- **Interactive Tooltips**: Detailed information on hover
- **Responsive Design**: Works on desktop and mobile

### Gap Analysis System
The application uses a sophisticated achievement tracking system:

#### **Achievement Detection**
- **Award-Based Logic**: Uses actual meet awards, not mathematical time comparisons
- **Non-Cumulative**: Each standard (BB, B, A) is tracked independently
  - Example: A swimmer with 40.00s time might receive B award, but not BB
  - The faster time doesn't automatically mean all lower standards are achieved
- **Personal Records**: Tracks best time per event and the award received for that performance

#### **Gap Calculation**
```
Gap = Current Best Time - Standard Time
- Negative gap: Swimmer's time is faster than standard
- Positive gap: Swimmer needs to improve to reach standard
```

#### **Display Logic**
- **Show Gaps**: For any standard NOT yet awarded, display `Math.abs(gap)` as a positive value
- **Hide Gaps**: For awarded standards, show no bar (achievement complete)
- **Achievement Badges**: Display ✓BB, ✓B, or ✓A next to event names based on exact awards
- **Color Coding**:
  - Green: BB competitive level
  - Yellow: A elite level

### Data Processing
- Automatic time conversion (MM:SS to seconds)
- Invalid time filtering (DQ, Pending)
- Inclusive month calculations
- Chronological sorting
- Personal record calculation per event
- Age group determination (10&U, 11-12) for standard lookups

### Error Handling
- Comprehensive error logging
- Graceful fallbacks for chart failures
- CSV parsing validation
- User-friendly error messages

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Deployment

This application is deployed on GitHub Pages and automatically updates when changes are pushed to the main branch via GitHub Actions.

**Live URL**: https://yvh1223.github.io/vihaan-swim-tracker/

## Database Backend (Supabase)

The project includes a **multi-swimmer normalized PostgreSQL database** hosted on Supabase for advanced analytics and data management.

### Why Database?
- ✅ **Multi-Swimmer Support**: Track multiple swimmers (family members, teammates) in one database
- ✅ **No Data Duplication**: Stores only facts, calculates insights on-demand
- ✅ **Always Accurate**: Gap tracking and personal bests calculated in real-time per swimmer
- ✅ **Smart Functions**: PostgreSQL functions determine next goals correctly
- ✅ **Efficient**: 44% smaller data footprint than denormalized approach
- ✅ **Scalable**: Ready for mobile apps, real-time sync, and team management

### Database Features

**Tables** (Store Facts Only):
- `swimmers` - Master table with swimmer profiles (name, age, LSC, club)
- `competition_results` - Swim meet times, dates, meets, LSC, time standards awarded
- `time_standards` - USA Swimming standards (AAAA → B) for age 10, includes LCM
- `practice_sessions` - Daily practice tracking per swimmer
- `improvement_goals` - Goal setting and progress per swimmer
- `team_progression` - Team history timeline per swimmer

**Views** (Derived Data per Swimmer):
- `progress_report` - Latest times with correct gap analysis (filtered by swimmer_id)
- `personal_bests` - Best times per event per swimmer (automatically derived)
- `latest_times_per_event` - Most recent swims per swimmer
- `competition_results_with_standards` - All results with calculations

**Functions** (Smart Calculations):
- `get_current_standard()` - Determines current level (AAAA, AAA, AA, A, BB, B, Below B)
- `get_next_standard_info()` - Returns **next immediate goal**, not top standard
  - Example: B → BB → A → AA → AAA → AAAA (correct progression ✅)
  - Not: B → AAAA (incorrect ❌)
- `format_time()` - Converts seconds to MM:SS.SS format

**Key Enhancements**:
- **Relational Design**: All tables linked to swimmers table via `swimmer_id` foreign key
- **CASCADE Deletion**: Removing a swimmer automatically cleans up all related data
- **Generated Columns**: Full name auto-generated from first and last name
- **LSC Tracking**: Local Swim Committee stored for both swimmers and meets
- **Actual Awards**: Stores time standards actually awarded at meets (not calculated)

### Quick Start

1. **Create Supabase Project**: https://supabase.com (free tier)

2. **Run Schema**:
   ```bash
   # In Supabase SQL Editor
   # Copy entire contents of supabase-schema-multi-swimmer.sql
   # Paste and click "Run"
   ```

3. **Configure `.env`**:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Import Data**:
   ```bash
   npm install
   node supabaseSetup-multi-swimmer.js
   ```

   The import script will:
   - Create swimmer profile for Vihaan H Huchchannavar
   - Import all competition results (including October 2025 meets)
   - Import team progression history
   - Associate all data with the swimmer's ID

### Sample Queries

**Get Progress Report for a Swimmer**:
```sql
-- Replace 1 with actual swimmer_id
SELECT * FROM progress_report
WHERE swimmer_id = 1
ORDER BY event_name;
```

**Find Events Closest to Next Goal**:
```sql
-- Replace 1 with actual swimmer_id
SELECT event_name, current_standard, next_standard, gap_seconds
FROM progress_report
WHERE swimmer_id = 1 AND next_standard IS NOT NULL
ORDER BY gap_seconds ASC
LIMIT 5;
```

**View All Times for an Event**:
```sql
-- Replace 1 with actual swimmer_id
SELECT event_date, time_formatted, current_standard, next_standard
FROM competition_results_with_standards
WHERE swimmer_id = 1 AND event_name = '100 FR SCY'
ORDER BY event_date DESC;
```

**List All Swimmers**:
```sql
SELECT id, full_name, current_age, lsc, club, active
FROM swimmers
ORDER BY full_name;
```

**Add New Swimmer**:
```sql
INSERT INTO swimmers (first_name, last_name, current_age, lsc, club)
VALUES ('John', 'Doe', 11, 'NT', 'Sample Swim Club')
RETURNING id, full_name;
```

### Documentation
- **SUPABASE_README.md** - Basic setup guide
- **NORMALIZED_SCHEMA_README.md** - Detailed schema documentation and benefits

## Future Enhancements

**Completed** ✅:
- [x] Supabase database with normalized multi-swimmer schema
- [x] Multi-swimmer support with relational design
- [x] Automatic gap calculation with correct next-standard logic
- [x] LSC and time standard tracking
- [x] LCM time standards support
- [x] October 2025 meet data integration
- [x] GitHub Pages deployment

**Planned** 📋:
- [ ] Connect website to Supabase backend for real-time data
- [ ] Multi-swimmer UI with swimmer selection
- [ ] Practice session tracking and analysis
- [ ] Goal setting UI with progress visualization
- [ ] Performance predictions based on historical improvement trends
- [ ] Export charts and reports to PDF for meet preparation
- [ ] Mobile app with offline support
- [ ] Coach and parent sharing capabilities
- [ ] Comparison with age group averages and peer performance
- [ ] Integration with USA Swimming database for automatic time standards updates
- [ ] Family dashboard showing multiple swimmers side-by-side

## Support

For issues or questions:
- **Website**: Check browser console for error messages
- **CSV Files**: Ensure files follow exact format in templates
- **Database**: See `NORMALIZED_SCHEMA_README.md` for troubleshooting
- **Setup**: See `SUPABASE_README.md` for database setup guide

---

**Created for tracking Vihaan's swimming journey from beginner to champion! 🏊‍♂️🏆**