/**
 * Batch USA Swimming Data Scraper
 *
 * Scrapes swimmer timing data for multiple swimmers
 * Usage: node batch_scrape_swimmers.js swimmers.json
 *
 * swimmers.json format:
 * [
 *   { "firstName": "Serena", "lastName": "Tsao" },
 *   { "firstName": "Vihaan", "lastName": "Huchchannavar" }
 * ]
 */

const fs = require('fs').promises;
const path = require('path');
const { scrapeSwimmer } = require('./scrape_usa_swimming_v2');

const OUTPUT_DIR = path.join(__dirname, 'scraped_data');
const BATCH_RESULTS_FILE = path.join(OUTPUT_DIR, `batch_results_${Date.now()}.json`);

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Load swimmers from JSON file
 */
async function loadSwimmers(filepath) {
  try {
    const data = await fs.readFile(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading swimmers file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Batch scrape multiple swimmers
 */
async function batchScrape(swimmers, delayBetween = 5000) {
  console.log('🏊‍♂️ Batch USA Swimming Data Scraper\n');
  console.log('='.repeat(50));
  console.log(`📋 Processing ${swimmers.length} swimmers...`);
  console.log('='.repeat(50) + '\n');

  const results = [];

  for (let i = 0; i < swimmers.length; i++) {
    const swimmer = swimmers[i];
    const { firstName, lastName } = swimmer;

    console.log(`\n[${ i + 1}/${swimmers.length}] Processing: ${firstName} ${lastName}`);
    console.log('-'.repeat(50));

    try {
      const result = await scrapeSwimmer(firstName, lastName);

      results.push({
        swimmer: { firstName, lastName },
        success: result.success,
        recordCount: result.data?.length || 0,
        filepath: result.filepath || null,
        error: result.error || null,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        console.log(`✅ Success: ${result.data.length} records collected`);
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }

      // Delay between requests to avoid rate limiting
      if (i < swimmers.length - 1) {
        console.log(`⏳ Waiting ${delayBetween/1000}s before next swimmer...`);
        await sleep(delayBetween);
      }

    } catch (error) {
      console.error(`❌ Error processing ${firstName} ${lastName}:`, error.message);

      results.push({
        swimmer: { firstName, lastName },
        success: false,
        recordCount: 0,
        filepath: null,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  return results;
}

/**
 * Save batch results summary
 */
async function saveBatchResults(results) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(BATCH_RESULTS_FILE, JSON.stringify(results, null, 2));

  console.log(`\n📄 Batch results saved: ${BATCH_RESULTS_FILE}`);
}

/**
 * Print summary
 */
function printSummary(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 BATCH SCRAPING SUMMARY');
  console.log('='.repeat(50));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalRecords = results.reduce((sum, r) => sum + r.recordCount, 0);

  console.log(`\nTotal swimmers processed: ${results.length}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total records collected: ${totalRecords}`);

  console.log('\nDetails:');
  console.log('-'.repeat(50));

  results.forEach((result, idx) => {
    const { swimmer, success, recordCount, error } = result;
    const status = success ? '✅' : '❌';
    const details = success ? `${recordCount} records` : `Error: ${error}`;

    console.log(`${idx + 1}. ${status} ${swimmer.firstName} ${swimmer.lastName}: ${details}`);
  });

  console.log('='.repeat(50) + '\n');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node batch_scrape_swimmers.js <swimmers-json-file> [delay-ms]');
    console.log('\nExample swimmers.json:');
    console.log(JSON.stringify([
      { firstName: "Serena", lastName: "Tsao" },
      { firstName: "Vihaan", lastName: "Huchchannavar" }
    ], null, 2));
    process.exit(1);
  }

  const swimmersFile = args[0];
  const delayBetween = args[1] ? parseInt(args[1]) : 5000;

  // Load swimmers
  const swimmers = await loadSwimmers(swimmersFile);

  if (!Array.isArray(swimmers) || swimmers.length === 0) {
    console.error('❌ Invalid swimmers file: must be an array with at least one swimmer');
    process.exit(1);
  }

  // Validate swimmer objects
  for (const swimmer of swimmers) {
    if (!swimmer.firstName || !swimmer.lastName) {
      console.error('❌ Invalid swimmer object: must have firstName and lastName');
      console.error('Invalid object:', swimmer);
      process.exit(1);
    }
  }

  // Batch scrape
  const results = await batchScrape(swimmers, delayBetween);

  // Save results
  await saveBatchResults(results);

  // Print summary
  printSummary(results);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { batchScrape };
