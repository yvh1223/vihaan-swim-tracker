# Vihaan Swim Tracker - Project Guide

## Repository & Deployment
- **Website**: https://yvh1223.github.io/vihaan-swim-tracker/
- **GitHub**: https://github.com/yvh1223/vihaan-swim-tracker
- **Git Email**: yvh1223@gmail.com (NEVER use salesforce email)
- **Hosting**: Static site on GitHub Pages (auto-deploys on push to main)

## Technology Stack
- Frontend: Vanilla JS, Chart.js, GitHub Pages
- Database: Supabase (via MCP)
- Scraping: Puppeteer (via master_scraper.js)
- Testing: Playwright MCP

## Core Data Patterns

### Time Standards Lookup (CRITICAL)
```javascript
// ALWAYS include course type in lookup key
const baseEvent = event.replace(/\s+(SCY|LCM|SCM)$/, '');
const courseMatch = event.match(/\s+(SCY|LCM|SCM)$/);
const courseType = courseMatch ? courseMatch[1] : 'SCY';
const standardsKey = `${baseEvent}_${courseType}`;
const standards = allTimeStandards[ageGroup][standardsKey];
```

**CRITICAL**: Standards ordered B > BB > A > AA > AAA > AAAA (in seconds, slower to faster)

### Age Group Calculation
```javascript
let ageGroup = '10 & under';
if (age >= 13) ageGroup = '13-14';
else if (age >= 11) ageGroup = '11-12';
```

### Gender Normalization
```javascript
const genderForDB = gender === 'F' || gender === 'Girls' ? 'Girls' : 'Boys';
```

## Data Scraping Workflow

### Master Scraper (RECOMMENDED)
```bash
# Check what will be scraped (dry run)
node scripts/master_scraper.js scripts/lac_swimmers_master.json --check-only

# Weekly incremental update (RECOMMENDED)
node scripts/master_scraper.js scripts/lac_swimmers_master.json

# Force full historical scrape
node scripts/master_scraper.js scripts/lac_swimmers_master.json --full
```

**Features**:
- Auto-detects incremental vs full scrape (90-day threshold)
- Duplicate prevention via SHA-256 hashing
- 5s rate limiting (prevents USA Swimming timeout)
- LAC team auto-selection for multi-match names
- Comprehensive logging per swimmer

**Decision Logic**:
| Condition | Action |
|-----------|--------|
| Swimmer not in DB | FULL scrape |
| Last event < 90 days | INCREMENTAL |
| Last event ≥ 90 days | FULL scrape |
| --full flag | FULL scrape |

### Name Formatting (CRITICAL)
✅ Correct: `"firstName": "Parker", "lastName": "Li"`
❌ Wrong: `"firstName": "Parker Li"` (includes last name)
❌ Wrong: `"firstName": "Brooke Anna"` (includes middle name)

USA Swimming search is **extremely sensitive** to name format.

### Rate Limiting (CRITICAL)
- **5s delays** between scrapes (enforced by master scraper)
- USA Swimming **times out** after 10+ rapid consecutive scrapes
- Increase to 10s if issues persist

## Data Loading Workflow

### Loading Scraped Data to Supabase

**METHOD 1: Supabase SQL Editor - Individual Swimmers (RECOMMENDED)**
```bash
# 1. Generate and split SQL files by swimmer
node scripts/generate_all_sql.js
node scripts/split_sql.js

# 2. Load each swimmer individually (smallest to largest recommended)
# Files are in scripts/sql_by_swimmer/
# See scripts/sql_by_swimmer/LOADING_ORDER.md for loading sequence

# 3. Open Supabase SQL Editor
# 4. Copy/paste each file content (one at a time)
# 5. Execute (duplicates auto-skipped via ON CONFLICT DO NOTHING)
```

**Note**: The consolidated `load_all_swimmers.sql` is too large for SQL Editor.
Use individual swimmer files instead (22 files, 29KB-110KB each).

**METHOD 2: Individual Swimmer Loading**
```bash
# Load one swimmer at a time
node scripts/load_to_supabase.js scripts/scraped_data/<file>.json

# NOTE: Requires SUPABASE_SERVICE_ROLE_KEY in .env
# Anon key blocked by RLS policies
```

**Duplicate Prevention**:
- Unique constraint on `(swimmer_id, event_name, event_date, COALESCE(meet_name, ''))`
- SQL uses `ON CONFLICT DO NOTHING` to skip duplicates
- Safe to run multiple times

### Loading Status Tracking

Check last loaded data:
```sql
SELECT
  s.full_name,
  MAX(cr.event_date) as latest_event,
  COUNT(*) as total_records
FROM swimmers s
LEFT JOIN competition_results cr ON s.id = cr.swimmer_id
GROUP BY s.id, s.full_name
ORDER BY s.last_name, s.first_name;
```

## Database Schema

### swimmers
- `id`, `first_name`, `last_name`, `full_name`
- `current_age` (must be updated periodically)
- `gender`: 'Girls' or 'Boys'
- `lsc`, `club`

### competition_results
- `swimmer_id` (FK)
- `event_name` (includes course: "50 FR SCY")
- `event_date`, `time_seconds`, `age`
- `time_standard` (stored, may be outdated)
- `course_type`: SCY, LCM, SCM

### time_standards
- `age_group`, `gender`, `event_name` (base, no course), `course_type`
- `b_standard` through `aaaa_standard` (seconds)
- **CRITICAL**: B > BB > A > AA > AAA > AAAA (slowest to fastest)

### team_progression
- `swimmer_id`, `team_name`, `start_date`, `end_date`
- Powers "My Journey" timeline

## Critical Historical Issues

### Issue 1: Inverted Time Standards (Jan 2025)
- **Problem**: Girls standards stored backwards (B < AAAA instead of B > AAAA)
- **Cause**: Data import error
- **Fix**: Created fix_inverted_standards.html to swap 259 Girls standards
- **Prevention**: Always verify B = slowest time when importing

### Issue 2: Course Type Missing in Lookups
- **Problem**: SCY standards applied to LCM/SCM events
- **Cause**: Lookup used `eventName` instead of `eventName_courseType`
- **Fix**: Modified all lookups to use `${baseEvent}_${courseType}` key
- **Files**: /js/app-new.js:489, 573, 644, 811

### Issue 3: My Journey Visibility
- **Problem**: Section shown even when no team data exists
- **Fix**: Hide `.timeline-section` when `teams.length === 0`
- **Location**: /js/app-new.js:2157-2166

## File Organization

### Active Production Files
```
vihaan-swim-tracker/
├── index.html
├── auth/
│   ├── login.html
│   ├── signup.html
│   └── coach-dashboard.html
├── css/
│   └── styles-new.css
├── js/
│   ├── app-new.js
│   ├── auth.js
│   ├── coach-feedback.js
│   ├── parent-view.js
│   └── supabase-client.js
├── scripts/
│   ├── master_scraper.js (MAIN ORCHESTRATOR)
│   ├── scrape_usa_swimming_v2.js
│   ├── load_to_supabase.js
│   ├── insert_lac_team_progression.js
│   └── lac_swimmers_master.json (6 LAC swimmers)
├── docs/ (practice plans, meet prep)
└── archive/ (historical files)
```

### Scraper Outputs
- `/scripts/scraped_data/` - JSON competition results
- `/scripts/logs/` - Detailed scraper logs
- `/scripts/reports/` - Scraping history & stats
- `/scripts/screenshots/` - Debug screenshots

## Development Workflow
1. Make changes locally
2. Test with Playwright MCP (UI verification)
3. Verify data with Supabase MCP
4. Test multiple swimmers (Vihaan, Swara)
5. Check course type handling (SCY, LCM, SCM)
6. Verify time standard calculations
7. Commit with yvh1223@gmail.com (descriptive messages)
8. Push to GitHub (auto-deploys to Pages)

## Code Standards
- Match existing style
- Minimal, focused changes
- Test before committing
- Archive obsolete files (don't delete)
- NEVER mention Claude/AI in commits

## Testing Requirements
- Use Playwright MCP for UI changes
- Test responsive design
- Verify multi-swimmer support
- Check course type handling
- Validate time standard calculations
- Ensure no duplicate data imports

## Latest Checkpoint (Dec 30, 2025)

### Completed
✅ **Data Scraping**: All 22 swimmers successfully scraped
  - Total records: 4,844 competition results
  - Success rate: 100% (1 retry: Audrey Gerard)
  - Files: `scripts/scraped_data/` (22 JSON files)
  - Old files archived: `archive/2025-12-30/scraped_data_old/` (35 files)

✅ **SQL Generation**: Consolidated SQL ready for loading
  - File: `scripts/load_all_swimmers.sql` (87k lines)
  - Includes all 22 swimmers with duplicate prevention
  - Uses `ON CONFLICT DO NOTHING` for safety

✅ **Data Loading**: Successfully loaded to Supabase (Dec 30, 2025)
  - Total records in database: 2,395
  - Records scraped: 4,844
  - Duplicates skipped: ~2,449 (ON CONFLICT worked perfectly)
  - Method: Individual SQL files via Supabase SQL Editor
  - All 22 swimmers loaded with latest events through Dec 14, 2025

### Next Incremental Run
```bash
# 1. Scrape latest data (auto-detects incremental vs full)
node scripts/master_scraper.js scripts/lac_swimmers_master.json

# 2. Generate SQL for new data
node scripts/generate_all_sql.js

# 3. Load to Supabase via SQL Editor
# Open scripts/load_all_swimmers.sql and execute in Supabase
```

### Files Generated This Session
- `scripts/load_all_swimmers.sql` - Consolidated SQL (too large for SQL Editor)
- `scripts/sql_by_swimmer/` - 22 individual SQL files (29KB-110KB each)
- `scripts/sql_by_swimmer/LOADING_ORDER.md` - Loading sequence guide
- `scripts/generate_all_sql.js` - SQL generation script
- `scripts/split_sql.js` - SQL splitter by swimmer
- `scripts/load_via_mcp.js` - Individual SQL generator
- `archive/2025-12-30/` - Archived old documentation and scraped data
