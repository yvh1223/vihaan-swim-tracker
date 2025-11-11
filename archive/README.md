# Archive Directory

This directory contains obsolete files that are no longer needed for active development but are preserved for reference.

## debugging-tools/
HTML files used to debug and fix data issues in the database:
- `check_all_standards.html` - Tool to verify time standards ordering
- `check_swara_ages.html` - Tool to check swimmer age calculations
- `debug_standards.html` - General debugging tool for time standards
- `verify_age_transition.html` - Tool to verify age group transitions
- `fix_inverted_standards.html` - One-time fix for inverted Girls standards (Jan 2025)

## old-scripts/
Superseded scripts and data files:
- `scrape_usa_swimming.js` - V1 scraper (replaced by scrape_usa_swimming_v2.js)
- `import_swara_data.js` - Old import script (replaced by load_to_supabase.js)
- `swara_scraped_data.json` - Old scraped data format
- `scraper_log.txt` - Log from V1 scraper
- `scraper_v2_log.txt` - Development log from V2 scraper

## Restoration
If you need to restore any files:
\`\`\`bash
cp archive/path/to/file destination/
\`\`\`
