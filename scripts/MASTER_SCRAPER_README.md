# Master USA Swimming Data Scraper

Comprehensive scraping solution for USA Swimming data with automatic incremental/historical load detection.

## Features

✅ **Intelligent Load Detection**
- Automatically detects if swimmer data already exists
- Chooses between full historical load or incremental update
- Prevents duplicate data insertion

✅ **Batch Processing**
- Process multiple swimmers in sequence
- Built-in rate limiting (5s delay between scrapes)
- Resume capability for failed batches

✅ **Team Management**
- Automatic team progression updates
- Creates "LAC - Gold I Swim Team" entries automatically

✅ **Comprehensive Reporting**
- Detailed logs for each swimmer
- JSON reports with complete scraping history
- Summary statistics

✅ **Flexible Modes**
- Auto mode: Intelligent decision making
- Full mode: Force complete rescrape
- Incremental mode: Only update existing swimmers
- Check mode: Preview what will be scraped

## Usage

### Basic Usage

```bash
# Auto mode - intelligently decides full vs incremental
node master_scraper.js swimmers.json

# Check what will be scraped (no actual scraping)
node master_scraper.js swimmers.json --check-only

# Force full rescrape for all swimmers
node master_scraper.js swimmers.json --full

# Only do incremental updates
node master_scraper.js swimmers.json --incremental
```

### Input File Format

Create a JSON file with your swimmers:

```json
[
  {
    "firstName": "Parker",
    "lastName": "Li",
    "gender": "Boys"
  },
  {
    "firstName": "Scarlett",
    "lastName": "Mann",
    "gender": "Girls"
  }
]
```

**Important:** Use simple first + last names (no middle names)

## How It Works

### 1. Analysis Phase

For each swimmer, the script:
- Checks if they exist in the database
- Retrieves their latest competition date
- Calculates days since last event
- Determines scrape strategy

### 2. Scrape Decision Logic

| Condition | Action |
|-----------|--------|
| Swimmer not in DB | **FULL** scrape (all historical data) |
| Last event < 90 days ago | **INCREMENTAL** scrape (recent data) |
| Last event ≥ 90 days ago | **FULL** scrape (may have old data) |
| `--full` flag | **FULL** scrape (forced) |
| `--incremental` flag | **INCREMENTAL** only |

### 3. Processing

For each swimmer:
1. **Scrape** data from USA Swimming
2. **Load** to Supabase database
3. **Update** team progression
4. **Wait** 5 seconds (rate limiting)

### 4. Reporting

Generates comprehensive reports:
- Individual scrape logs
- JSON report with all results
- Summary statistics

## Output Structure

```
scripts/
├── scraped_data/        # JSON files with competition results
├── logs/                # Detailed logs for each swimmer
└── reports/             # JSON reports with complete history
```

## Examples

### Example 1: Initial Team Load

```bash
# Create swimmers list
cat > lac_team.json << 'EOF'
[
  {"firstName": "Parker", "lastName": "Li", "gender": "Boys"},
  {"firstName": "Scarlett", "lastName": "Mann", "gender": "Girls"},
  {"firstName": "Kiaan", "lastName": "Patel", "gender": "Boys"}
]
EOF

# Check what will happen (no scraping)
node master_scraper.js lac_team.json --check-only

# Run the scrape
node master_scraper.js lac_team.json
```

**Output:**
```
🏊‍♂️ Master USA Swimming Data Scraper
==================================================
📋 Loaded 3 swimmers from lac_team.json
🔧 Mode: AUTO

📊 Analyzing existing data...

🆕 Parker Li (Boys)
   └─ Action: FULL

🆕 Scarlett Mann (Girls)
   └─ Action: FULL

🆕 Kiaan Patel (Boys)
   └─ Action: FULL

🚀 Starting scraping process...

[1/3] Processing: Parker Li
   └─ 🔍 Scraping (FULL)...
   └─ ✅ Scraped 228 records (45.2s)
   └─ 💾 Loading to database...
   └─ ✅ Loaded: 111 new, 117 duplicates
   └─ ✅ Team progression updated
   └─ ✓ Complete
   └─ ⏳ Waiting 5s before next scrape...
```

### Example 2: Weekly Update (Incremental)

```bash
# Run weekly - only gets new competitions
node master_scraper.js lac_team.json
```

**Output:**
```
📊 Analyzing existing data...

📈 Parker Li (Boys)
   └─ ID: 21 | Records: 111 | Last: 2025-10-05
   └─ Days since last event: 7
   └─ Action: INCREMENTAL

📈 Scarlett Mann (Girls)
   └─ ID: 22 | Records: 94 | Last: 2025-10-12
   └─ Days since last event: 0
   └─ Action: INCREMENTAL
```

### Example 3: Force Full Rescrape

```bash
# Rescrape everything (useful after data corruption)
node master_scraper.js lac_team.json --full
```

### Example 4: Check Before Running

```bash
# Preview what will happen
node master_scraper.js all_swimmers.json --check-only

# Output shows plan without scraping
# Review, then run without --check-only when ready
node master_scraper.js all_swimmers.json
```

## Report Format

The JSON report includes:

```json
{
  "startTime": "2025-11-03T02:00:00.000Z",
  "endTime": "2025-11-03T02:15:30.000Z",
  "duration": 930000,
  "summary": {
    "total": 6,
    "fullScrape": 3,
    "incrementalScrape": 2,
    "noScrapeNeeded": 0,
    "failed": 1
  },
  "swimmers": [
    {
      "swimmer": {
        "firstName": "Parker",
        "lastName": "Li",
        "gender": "Boys"
      },
      "action": "SUCCESS",
      "scrapeType": "FULL",
      "scrapeResult": {
        "recordCount": 228,
        "duration": 45200,
        "filePath": "scraped_data/Parker_Li_1730596800000.json"
      },
      "loadResult": {
        "inserted": 111,
        "skipped": 117,
        "swimmerId": 21
      }
    }
  ]
}
```

## Configuration

Edit the `CONFIG` object in `master_scraper.js`:

```javascript
const CONFIG = {
  SCRAPE_DELAY_MS: 5000,    // Delay between scrapes
  BATCH_SIZE: 5,             // Swimmers per batch
  MAX_RETRIES: 2,            // Retry failed scrapes
  OUTPUT_DIR: 'scraped_data',
  LOGS_DIR: 'logs',
  REPORTS_DIR: 'reports'
};
```

## Troubleshooting

### Rate Limiting

**Problem:** Getting timeout errors

**Solution:** Increase `SCRAPE_DELAY_MS` to 10000 (10 seconds)

### No Data Found

**Problem:** Swimmer returns 0 records

**Solution:**
- Check name spelling (no middle names)
- Verify swimmer exists on USA Swimming website
- Check gender is correct (Boys/Girls)

### Duplicate Detection

**Problem:** Records being marked as duplicates

**Solution:** This is normal! The script uses SHA-256 hashing to prevent duplicates. Only NEW records are inserted.

### Team Name Issues

**Problem:** Team showing as "Lakeside Aquatic Club" instead of "LAC - Gold I Swim Team"

**Solution:**
- Clear browser cache and reload
- Team progression is automatically updated by the script
- Check database: `team_progression` table should have entries

## Scheduled Updates

### Using Cron (Mac/Linux)

```bash
# Edit crontab
crontab -e

# Add weekly update (every Sunday at 2 AM)
0 2 * * 0 cd /path/to/scripts && node master_scraper.js lac_team.json >> weekly_scrape.log 2>&1
```

### Manual Schedule

Run weekly or bi-weekly for active swimmers:
```bash
# Weekly update
node master_scraper.js active_swimmers.json

# Check report
cat reports/scrape_report_*.json | tail -1
```

## Best Practices

1. **Start with --check-only** - Preview before scraping
2. **Use simple names** - No middle names in firstName field
3. **Monitor reports** - Check JSON reports for issues
4. **Schedule wisely** - Weekly updates for active swimmers
5. **Keep backups** - Save old reports for history
6. **Rate limiting** - Don't decrease delay below 5 seconds

## Files Reference

| File | Purpose |
|------|---------|
| `master_scraper.js` | Main orchestration script |
| `scrape_usa_swimming_v2.js` | Individual swimmer scraper |
| `load_to_supabase.js` | Database loader |
| `insert_lac_team_progression.js` | Team progression updater |

## Advanced Usage

### Custom Swimmer List

```bash
# Get swimmers needing updates
node -e "
const { createClient } = require('@supabase/supabase-js');
// Query swimmers with old data
// Export to JSON
// Run master_scraper with that list
"
```

### Parallel Processing (Advanced)

For large teams, split into batches:

```bash
# Split swimmers into batches
split -l 10 all_swimmers.json batch_

# Process each batch
for batch in batch_*; do
  node master_scraper.js $batch
  sleep 60  # 1 minute between batches
done
```

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review reports in `reports/` directory
3. Verify database state with Supabase dashboard
4. Check USA Swimming website for data availability
