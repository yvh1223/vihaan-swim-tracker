# Periodic USA Swimming Data Extraction - TODO List

## Purpose
Track swimmers requiring periodic incremental data extraction from USA Swimming database.

## Remaining Swimmers to Scrape

### 1. Parker Li (Boys)
- **Status**: ✅ LAC record confirmed (Age 10, NT, need to scroll to find)
- **Position**: Multiple results, LAC swimmer exists in list
- **Resolution**: Scraper will automatically select LAC using enhanced logic
- **Command**: `node scrape_usa_swimming_v2.js "Parker" "Li"`
- **Verify Team**: `jq -r '.[0].team' scraped_data/Parker_Li_*.json` (should show "Lakeside Aquatic Club")

### 2. Scarlett Mann (Girls)
- **Status**: ✅ LAC record confirmed as "Scarlett Lee Mann" (Age 10, NT, 3rd result)
- **Position**: Multiple results, LAC swimmer is 3rd in list
- **Resolution**: Scraper will automatically select LAC using enhanced logic
- **Command**: `node scrape_usa_swimming_v2.js "Scarlett" "Mann"`
- **Verify Team**: `jq -r '.[0].team' scraped_data/Scarlett_Mann_*.json`

### 3. Kiaan Patel (Boys)
- **Status**: ✅ LAC record confirmed as "Kiaan Devang Patel" (Age 10, NT, 3rd result)
- **Position**: Multiple results, LAC swimmer is 3rd in list
- **Resolution**: Scraper will automatically select LAC using enhanced logic
- **Command**: `node scrape_usa_swimming_v2.js "Kiaan" "Patel"`
- **Verify Team**: `jq -r '.[0].team' scraped_data/Kiaan_Patel_*.json`

### 4. Brooke Long (Girls)
- **Full Name**: Brooke Anna Long (Age 9, NT)
- **Status**: ✅ LAC record confirmed (6th result in list)
- **Position**: Multiple results, LAC swimmer is 6th in list
- **Resolution**: Scraper will automatically select LAC using enhanced logic
- **Command**: `node scrape_usa_swimming_v2.js "Brooke" "Long"`
- **Verify Team**: `jq -r '.[0].team' scraped_data/Brooke_Long_*.json`
- **Expected**: Lakeside Aquatic Club

### 5. Jason Ma (Boys)
- **Full Name**: Jason YJ Ma (Age 9, NT)
- **Status**: ✅ LAC record confirmed (need to scroll to find)
- **Position**: Multiple results, LAC swimmer exists in list
- **Resolution**: Scraper will automatically select LAC using enhanced logic
- **Command**: `node scrape_usa_swimming_v2.js "Jason" "Ma"`
- **Verify Team**: `jq -r '.[0].team' scraped_data/Jason_Ma_*.json`
- **Expected**: Lakeside Aquatic Club

### 6. William Power (Boys)
- **Full Name**: William Dale Power (Age 10, NT)
- **Status**: ✅ LAC record confirmed (6th result in list)
- **Position**: Multiple results, LAC swimmer is 6th in list
- **Resolution**: Scraper will automatically select LAC using enhanced logic
- **Command**: `node scrape_usa_swimming_v2.js "William" "Power"`
- **Verify Team**: `jq -r '.[0].team' scraped_data/William_Power_*.json`
- **Expected**: Lakeside Aquatic Club

## Scraping Best Practices

### Name Formatting
✅ **DO**: Use first name + last name only (e.g., "Parker", "Li")
❌ **DON'T**: Use middle names (e.g., "Parker Li", "Li")
❌ **DON'T**: Use full names with middle names (causes search failures)

### Rate Limiting
- Wait **5-10 minutes** between large batches (10+ swimmers)
- USA Swimming website may timeout after many consecutive scrapes
- Watch for navigation timeouts as indicator

### Team Verification
**CRITICAL**: Always verify team field before loading to Supabase

```bash
# Single file verification
jq -r '.[0].team' scraped_data/filename.json

# Batch verification
for file in scraped_data/*.json; do
  team=$(jq -r '.[0].team // "NO_DATA"' "$file")
  echo "$file -> $team"
done
```

### Load to Supabase
```bash
# Single swimmer
node load_to_supabase.js scraped_data/firstname_lastname_timestamp.json

# Multiple swimmers (after team verification)
for file in scraped_data/Parker_Li*.json scraped_data/Scarlett_Mann*.json; do
  node load_to_supabase.js "$file"
done
```

## Periodic Extraction Schedule

### Frequency
- **Initial**: Manual scraping when rate limiting allows
- **Ongoing**: Monthly or after major meets
- **Trigger**: New competitions or updated records

### Success Criteria
- ✅ All 6 swimmers successfully scraped
- ✅ Team field verified as "Lakeside Aquatic Club"
- ✅ Data loaded to Supabase without errors
- ✅ Duplicate detection working (expected ~50% duplicate rate)

## Status Summary
- **Total Swimmers**: 6 remaining
- **Successfully Loaded**: 13 swimmers (1,256 unique records)
- **Next Action**: Wait for rate limiting to clear, then scrape remaining 6 swimmers
- **Last Updated**: 2025-11-02

## Notes
- Scraper automatically selects "Lakeside Aquatic Club" when multiple results found
- Duplicate detection handles re-scraping automatically
- Screenshot debugging available in `scripts/screenshots/` if needed
- Enhanced LAC selection logic implemented in `scrape_usa_swimming_v2.js:146-170`
