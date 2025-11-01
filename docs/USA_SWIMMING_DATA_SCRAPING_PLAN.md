# USA Swimming Data Scraping & Automated Import Plan

## Executive Summary

This document outlines multiple options for automatically scraping swimmer data from USA Swimming's official database and importing it into the Supabase backend for the swim tracker application.

**Goal**: Enable automatic data retrieval for all swimmers in Vihaan's LSC (Local Swim Committee) team, eliminating manual data entry.

---

## 1. Data Source Analysis

### USA Swimming Official Database
- **URL**: https://data.usaswimming.org/datahub/usas/individualsearch
- **Access**: Public, no authentication required
- **Data Available**:
  - Individual times by swimmer name
  - Event details (event name, course type, distance, stroke)
  - Performance data (time, points, time standard)
  - Meet information (name, date, LSC)
  - Team/Club affiliation

### Tested Scraping Results (Vihaan Huchchannavar)
```json
{
  "swimmer": "Vihaan H Huchchannavar",
  "age": 10,
  "lsc": "NT",
  "team": "Lakeside Aquatic Club",
  "results_count": 13,
  "sample_data": [
    {
      "event": "100 FR SCY",
      "swim_time": "1:14.72",
      "age": "10",
      "points": "344",
      "time_standard": "BB",
      "meet": "2025 NT IRON 14 & Under Division \"A\" B/C Meet",
      "lsc": "NT",
      "team": "Lakeside Aquatic Club",
      "swim_date": "10/11/2025"
    }
  ]
}
```

---

## 2. Current Database Schema

### Existing Tables (Supabase)

#### `swimmers` table
```sql
- id: BIGSERIAL PRIMARY KEY
- first_name: TEXT
- last_name: TEXT
- full_name: TEXT (GENERATED)
- date_of_birth: DATE
- current_age: INTEGER
- lsc: TEXT
- club: TEXT
- active: BOOLEAN
- gender: TEXT
```

#### `competition_results` table
```sql
- id: BIGSERIAL PRIMARY KEY
- swimmer_id: BIGINT (FK to swimmers)
- event_name: TEXT
- meet_name: TEXT
- event_date: DATE
- time_formatted: TEXT
- time_seconds: DECIMAL
- course_type: TEXT
- distance: TEXT
- stroke: TEXT
- time_standard: TEXT
- points: INTEGER
- lsc: TEXT
- team: TEXT
- age: INTEGER
```

#### `time_standards` table
```sql
- id: BIGSERIAL PRIMARY KEY
- event_name: TEXT
- age_group: TEXT
- gender: TEXT
- course_type: TEXT
- aaaa_standard: DECIMAL
- aaa_standard: DECIMAL
- aa_standard: DECIMAL
- a_standard: DECIMAL
- bb_standard: DECIMAL
- b_standard: DECIMAL
```

---

## 3. Implementation Options

### Option 1: Browser-Based Scraping with Puppeteer MCP (Recommended)

**Advantages**:
- ✅ Already integrated with Claude Code via MCP
- ✅ Handles JavaScript-rendered pages
- ✅ Can automate form filling and navigation
- ✅ Proven working with Vihaan's data extraction
- ✅ No external dependencies or API keys needed

**Implementation**:
```javascript
// 1. Navigate to USA Swimming search page
// 2. Fill in swimmer first and last name
// 3. Click search button
// 4. Extract table data from results
// 5. Parse and transform data
// 6. Insert into Supabase via API
```

**Code Structure**:
```
/scripts/
  ├── scrape-usa-swimming.js       # Main scraping logic
  ├── parse-swim-data.js            # Data transformation
  ├── import-to-supabase.js         # Database insertion
  └── team-roster.json              # List of swimmers to scrape
```

**Workflow**:
1. Maintain a team roster file with swimmer names
2. Run scraping script (manual or scheduled)
3. For each swimmer:
   - Search USA Swimming database
   - Extract all times
   - Transform data to match schema
   - Check for duplicates
   - Insert new records into Supabase
4. Generate import report

### Option 2: Direct HTTP Requests with Cheerio

**Advantages**:
- ⚡ Faster than browser automation
- 💾 Lower resource usage
- 🔧 Simpler code structure

**Disadvantages**:
- ❌ May not work if site uses heavy JavaScript
- ❌ More fragile to UI changes
- ❌ Requires understanding of network requests

**Implementation**:
```javascript
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeSw immer(firstName, lastName) {
  // POST request to search endpoint
  // Parse HTML response
  // Extract table data
  // Return structured JSON
}
```

### Option 3: Official USA Swimming API (If Available)

**Status**: 🔍 Needs investigation
- Check if USA Swimming offers official API
- May require membership or authentication
- Would be most reliable long-term solution

**Action Items**:
- Contact USA Swimming tech support
- Check developer documentation
- Request API access if available

### Option 4: Third-Party Services (Swimcloud, SwimStandards)

**SwimCloud** (https://www.swimcloud.com):
- May have better API access
- More structured data
- Potentially requires subscription

**SwimStandards** (https://swimstandards.com):
- Mobile-friendly interface
- Claims 8.6M swims in database
- Investigate data access options

---

## 4. Recommended Implementation: Puppeteer MCP Scraper

### Phase 1: Single Swimmer Automation (Week 1)

**Goal**: Automate Vihaan's data import

**Tasks**:
1. Create `scripts/scrape-swimmer.js` using Puppeteer MCP
2. Implement data extraction from USA Swimming
3. Add data transformation logic
4. Create Supabase import function
5. Add duplicate detection (by event_name + event_date + time_seconds)
6. Test with Vihaan's profile

**Deliverables**:
- Working script for single swimmer
- Documentation for running manually
- Error handling and logging

### Phase 2: Team Roster Management (Week 2)

**Goal**: Support multiple swimmers

**Tasks**:
1. Create `team-roster.json`:
```json
{
  "team_name": "Lakeside Aquatic Club - Gold",
  "lsc": "NT",
  "swimmers": [
    {
      "first_name": "Vihaan",
      "last_name": "Huchchannavar",
      "date_of_birth": "2015-XX-XX",
      "gender": "M",
      "active": true
    },
    {
      "first_name": "Teammate1",
      "last_name": "LastName1",
      "date_of_birth": "2015-XX-XX",
      "gender": "F",
      "active": true
    }
  ]
}
```

2. Implement batch processing
3. Add progress reporting
4. Create email/notification system for import results
5. Add rate limiting to avoid overwhelming USA Swimming server

**Deliverables**:
- Team roster management interface
- Batch import script
- Import status dashboard

### Phase 3: Automation & Scheduling (Week 3)

**Goal**: Automatic weekly updates

**Tasks**:
1. Set up GitHub Actions or cloud function (Vercel, Netlify, AWS Lambda)
2. Schedule weekly scraping (every Sunday night)
3. Implement change detection (only import new times)
4. Add email notifications for:
   - New time standards achieved
   - Personal bests broken
   - Import errors
5. Create admin dashboard for monitoring

**Deliverables**:
- Automated scheduled imports
- Monitoring dashboard
- Error alerting system

### Phase 4: Data Quality & Enhancement (Week 4)

**Goal**: Improve data accuracy and completeness

**Tasks**:
1. Validate time conversions (MM:SS.SS format)
2. Calculate accurate time standards based on age at swim
3. Add meet type detection (Championship vs Invitational)
4. Implement data quality checks
5. Add manual override capability
6. Create data reconciliation report

**Deliverables**:
- Data quality dashboard
- Reconciliation tools
- Manual data correction interface

---

## 5. Technical Architecture

### Data Flow
```
USA Swimming Website
        ↓
  Puppeteer MCP
        ↓
  Data Extraction
        ↓
  Data Transformation
        ↓
  Duplicate Detection
        ↓
  Supabase Import
        ↓
  Web Application
```

### File Structure
```
vihaan-swim-tracker/
├── scripts/
│   ├── import/
│   │   ├── scrape-swimmer.js        # Core scraping logic
│   │   ├── parse-swim-data.js       # Data transformation
│   │   ├── import-to-supabase.js    # Database operations
│   │   ├── batch-import.js          # Team roster processing
│   │   └── schedule-import.js       # Automation logic
│   ├── config/
│   │   ├── team-roster.json         # Swimmer list
│   │   └── import-config.json       # Configuration
│   └── utils/
│       ├── time-converter.js        # Time format utilities
│       ├── duplicate-detector.js    # Deduplication logic
│       └── logger.js                # Logging utilities
├── docs/
│   └── USA_SWIMMING_DATA_SCRAPING_PLAN.md
└── .github/
    └── workflows/
        └── weekly-import.yml        # GitHub Actions config
```

### Sample Code: Core Scraper

```javascript
// scripts/import/scrape-swimmer.js
const puppeteer = require('puppeteer');

async function scrapeSwimmerData(firstName, lastName) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    // Navigate to USA Swimming search
    await page.goto('https://data.usaswimming.org/datahub/usas/individualsearch');

    // Fill in search form
    await page.type('#firstOrPreferredName', firstName);
    await page.type('#lastName', lastName);

    // Click search button
    await page.click('button[type="submit"]');
    await page.waitForSelector('tbody');

    // Click "See Results" for the swimmer
    await page.click('tbody button');
    await page.waitForSelector('table');

    // Extract data from results table
    const swimData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return {
          event: cells[0]?.textContent.trim(),
          swim_time: cells[1]?.textContent.trim(),
          age: parseInt(cells[2]?.textContent.trim()),
          points: parseInt(cells[3]?.textContent.trim()),
          time_standard: cells[4]?.textContent.trim(),
          meet: cells[5]?.textContent.trim(),
          lsc: cells[6]?.textContent.trim(),
          team: cells[7]?.textContent.trim(),
          swim_date: cells[8]?.textContent.trim()
        };
      });
    });

    return {
      firstName,
      lastName,
      results: swimData
    };

  } finally {
    await browser.close();
  }
}

module.exports = { scrapeSwimmerData };
```

---

## 6. Data Transformation Requirements

### Time Conversion
```javascript
function convertTimeToSeconds(timeString) {
  // Handle MM:SS.SS format
  if (timeString.includes(':')) {
    const [minutes, seconds] = timeString.split(':');
    return parseFloat(minutes) * 60 + parseFloat(seconds);
  }
  // Handle SS.SS format
  return parseFloat(timeString);
}
```

### Event Name Normalization
```javascript
function normalizeEventName(event) {
  // USA Swimming: "100 FR SCY"
  // Our format: "100 FR SCY"
  // Ensure consistent formatting
  return event.trim().toUpperCase();
}
```

### Date Parsing
```javascript
function parseSwimDate(dateString) {
  // USA Swimming: "10/11/2025" (MM/DD/YYYY)
  // Our format: ISO 8601 (YYYY-MM-DD)
  const [month, day, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
```

---

## 7. Duplicate Detection Strategy

### Primary Key for Deduplication
```sql
-- Unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_competition_results_unique
ON competition_results(swimmer_id, event_name, event_date, meet_name, time_seconds);
```

### Import Logic
```javascript
async function importSwimResult(swimmerI d, result) {
  // Check if record already exists
  const existing = await supabase
    .from('competition_results')
    .select('id')
    .eq('swimmer_id', swimmerId)
    .eq('event_name', result.event)
    .eq('event_date', result.date)
    .eq('time_seconds', result.time_seconds)
    .single();

  if (existing.data) {
    console.log('Record already exists, skipping...');
    return { skipped: true };
  }

  // Insert new record
  const { data, error } = await supabase
    .from('competition_results')
    .insert({
      swimmer_id: swimmerId,
      event_name: result.event,
      // ... other fields
    });

  return { inserted: true, data };
}
```

---

## 8. Team Roster Discovery

### Option A: Manual Team Roster Entry
- Create web form to add swimmers
- Store in `team-roster.json` or new `team_members` table
- Admin manually adds/removes swimmers

### Option B: Auto-Discovery via Meet Results
- Search for recent meets (e.g., "2025 NT LAC Splashing Pumpkins")
- Extract all swimmers from that meet
- Filter by team name ("Lakeside Aquatic Club")
- Suggest swimmers for roster

### Option C: LSC Team Roster API
- Some LSCs publish team rosters
- Check if NT (North Texas) LSC has public roster
- Scrape or API call to get full team list

---

## 9. Estimated Timeline

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| Phase 1: Single Swimmer | 1 week | 10-15 hours | High |
| Phase 2: Team Roster | 1 week | 10-15 hours | High |
| Phase 3: Automation | 1 week | 8-12 hours | Medium |
| Phase 4: Data Quality | 1 week | 6-10 hours | Low |
| **Total** | **4 weeks** | **34-52 hours** | - |

---

## 10. Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| USA Swimming blocks scrapers | Medium | High | Use reasonable rate limiting, add user-agent headers |
| Website structure changes | Medium | Medium | Abstract scraping logic, add error handling |
| Data quality issues | Low | Medium | Implement validation and reconciliation |
| Supabase rate limits | Low | Low | Batch operations, monitor usage |

### Legal/Ethical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Terms of Service violation | Low | High | Review USA Swimming ToS, use data responsibly |
| Privacy concerns | Low | Medium | Only import public data, respect privacy |
| Data accuracy liability | Low | Low | Add disclaimers, allow manual corrections |

---

## 11. Success Metrics

- **Data Coverage**: >95% of team's swims imported correctly
- **Accuracy**: <1% data discrepancies vs manual entry
- **Performance**: Complete team import in <5 minutes
- **Reliability**: >99% successful scheduled runs
- **User Satisfaction**: Coaches/parents prefer automated system

---

## 12. Next Steps

### Immediate Actions (This Week)
1. ✅ Test Puppeteer scraping with Vihaan (DONE)
2. ✅ Document database schema (DONE)
3. 🔲 Create `scripts/import/scrape-swimmer.js`
4. 🔲 Test data transformation with sample data
5. 🔲 Implement Supabase import function
6. 🔲 Create team roster JSON file

### Short-term (Next 2 Weeks)
1. Complete Phase 1: Single swimmer automation
2. Collect team roster from coach/parents
3. Start Phase 2: Multi-swimmer support
4. Set up error logging and monitoring

### Long-term (Month 2+)
1. Implement scheduled automation
2. Build admin dashboard
3. Explore official API options
4. Add data quality features

---

## 13. Alternative Approaches

### Manual Upload with Enhanced UI
- Keep current manual entry
- Improve upload interface
- Add validation and autocomplete
- Still requires manual work but faster

### Hybrid Approach
- Automated scraping for bulk import
- Manual entry for corrections/additions
- Best of both worlds

---

## Appendix A: USA Swimming Data Fields

### Available Fields from Scraping
```
- Event (e.g., "100 FR SCY")
- Swim Time (e.g., "1:14.72")
- Age (e.g., 10)
- Points (e.g., 344)
- Time Standard (e.g., "BB")
- Meet Name (e.g., "2025 NT IRON 14 & Under...")
- LSC (e.g., "NT")
- Team (e.g., "Lakeside Aquatic Club")
- Swim Date (e.g., "10/11/2025")
```

### Missing Fields (Require Calculation)
- `time_seconds`: Calculate from `swim_time`
- `course_type`: Extract from `event` (SCY/LCM/SCM)
- `distance`: Extract from `event` (50/100/200/500/1650)
- `stroke`: Extract from `event` (FR/BK/BR/FL/IM)
- `swimmer_id`: Lookup or create from name

---

## Appendix B: Sample Team Roster JSON

```json
{
  "team": {
    "name": "Lakeside Aquatic Club - Gold",
    "lsc": "NT",
    "location": "North Texas",
    "active": true
  },
  "swimmers": [
    {
      "first_name": "Vihaan",
      "last_name": "Huchchannavar",
      "date_of_birth": "2015-XX-XX",
      "gender": "M",
      "active": true,
      "notes": "Primary tracker user"
    },
    {
      "first_name": "Teammate",
      "last_name": "One",
      "date_of_birth": "2015-XX-XX",
      "gender": "F",
      "active": true
    }
  ],
  "metadata": {
    "last_updated": "2025-10-19",
    "import_frequency": "weekly",
    "auto_import_enabled": true
  }
}
```

---

## Appendix C: Supabase Import Function

```javascript
// scripts/import/import-to-supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importSwimmerResults(swimmerData) {
  try {
    // 1. Find or create swimmer
    let swimmer = await findSwimmer(
      swimmerData.firstName,
      swimmerData.lastName
    );

    if (!swimmer) {
      swimmer = await createSwimmer({
        first_name: swimmerData.firstName,
        last_name: swimmerData.lastName,
        current_age: swimmerData.results[0]?.age,
        lsc: swimmerData.results[0]?.lsc,
        club: swimmerData.results[0]?.team
      });
    }

    // 2. Import each result
    const importResults = {
      inserted: 0,
      skipped: 0,
      errors: 0
    };

    for (const result of swimmerData.results) {
      try {
        const outcome = await importSingleResult(swimmer.id, result);
        if (outcome.inserted) importResults.inserted++;
        if (outcome.skipped) importResults.skipped++;
      } catch (error) {
        console.error('Error importing result:', error);
        importResults.errors++;
      }
    }

    return importResults;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

module.exports = { importSwimmerResults };
```

---

**Document Version**: 1.0
**Created**: 2025-10-19
**Last Updated**: 2025-10-19
**Author**: Claude Code
**Status**: Proposal - Ready for Implementation
