# LAC Initial Scraping - Archive

This directory contains scripts and configurations from the initial LAC swimmer scraping project (Nov 2-3, 2025).

## Purpose

These files were used during the initial scraping and debugging phase to successfully scrape and load 6 LAC swimmers. They have been superseded by the **Master Scraper System** (`master_scraper.js`) which provides comprehensive automation for incremental and full historical loads.

## Archive Contents

### `/scripts/`
- `batch_scrape_swimmers.js` - Initial batch scraping script (superseded by `master_scraper.js`)
- `update_lac_team_progression.js` - ES6 version of team progression script (superseded by CommonJS version)
- `insert_lac_team.sql` - SQL-based team progression insert (superseded by Node.js script)

### `/configs/`
Swimmer configuration files from initial scraping attempts:
- `lac_swimmers.json` - Initial list (middle names issue)
- `lac_swimmers_additional.json` - Additional swimmers attempt
- `lac_swimmers_final.json` - Final subset attempt
- `lac_swimmers_remaining.json` - Remaining swimmers (middle names issue)
- `lac_swimmers_rescrape.json` - Rescrape attempt
- `lac_swimmers_retry.json` - Retry with middle names
- `lac_swimmers_retry_simple.json` - Simple names (worked!)
- `lac_swimmers_william_power.json` - Individual swimmer
- `swimmers_example.json` - Original template

### `/logs/`
Batch scraping log files from initial attempts (8 files, ~457 KB total):
- `batch_scrape_log.txt` - Initial scraping attempt (209 KB)
- `batch_scrape_additional_log.txt` - Additional swimmers (48 KB)
- `batch_scrape_remaining_log.txt` - Remaining swimmers (65 KB)
- `batch_scrape_final_log.txt` - Final attempt (6.7 KB)
- `batch_scrape_rescrape_log.txt` - Rescrape attempt (25 KB)
- `batch_scrape_retry_log.txt` - Retry with middle names (44 KB)
- `batch_scrape_retry_simple_log.txt` - Simple names (36 KB)
- `batch_scrape_william_power_log.txt` - Individual swimmer (21 KB)

### `/docs/`
- `LAC_SWIMMERS_SUMMARY.md` - Initial scraping results summary
- `PERIODIC_SCRAPING_TODO.md` - Planning document (superseded by implemented master scraper)

## Key Learnings

These files document important lessons learned:

1. **Name Format**: Use simple first + last names only (no middle names)
2. **LAC Auto-Selection**: Scraper successfully finds and selects Lakeside Aquatic Club
3. **Rate Limiting**: 5+ second delays required between scrapes
4. **Team Progression**: ES6 modules failed due to missing package.json, CommonJS works
5. **RLS Bypass**: SERVICE_ROLE key required for team_progression inserts

## Migration to Master Scraper

The master scraper system (`/scripts/master_scraper.js`) consolidates all learning from these initial attempts:

- ✅ Automatic incremental/full load detection
- ✅ Intelligent 90-day threshold logic
- ✅ Built-in rate limiting and retry logic
- ✅ Team progression management
- ✅ Comprehensive error handling
- ✅ JSON reporting and logging

## Current Production Files

Use these active files instead:

- `master_scraper.js` - Main orchestration script
- `MASTER_SCRAPER_README.md` - Complete documentation
- `lac_swimmers_master.json` - Production swimmer list
- `insert_lac_team_progression.js` - Team progression utility (CommonJS)
- `LAC_PROJECT_COMPLETION_SUMMARY.md` - Project overview

## Final Results

All 6 LAC swimmers successfully scraped and loaded:
- Parker Li (ID 21): 111 records
- Scarlett Mann (ID 22): 94 records
- Kiaan Patel (ID 23): 54 records
- Brooke Long (ID 24): 102 records
- Jason Ma (ID 25): 38 records
- William Power (ID 26): 85 records

**Total:** 990 records scraped, 484 unique loaded, 506 duplicates prevented

---

**Archived:** 2025-11-03
**Superseded By:** Master Scraper System
