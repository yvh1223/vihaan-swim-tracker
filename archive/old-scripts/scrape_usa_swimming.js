/**
 * USA Swimming Data Scraper
 *
 * Scrapes swimmer timing data from data.usaswimming.org
 * Usage: node scrape_usa_swimming.js "FirstName" "LastName"
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = 'https://data.usaswimming.org/datahub/usas/individualsearch';
const OUTPUT_DIR = path.join(__dirname, 'scraped_data');
const WAIT_TIMEOUT = 10000;
const NAVIGATION_TIMEOUT = 30000;

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Initialize browser with proper configuration
 */
async function initBrowser() {
  return await puppeteer.launch({
    headless: false, // Set to true for production
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ],
    defaultViewport: {
      width: 1400,
      height: 900
    }
  });
}

/**
 * Search for swimmer by name
 */
async function searchSwimmer(page, firstName, lastName) {
  console.log(`Searching for: ${firstName} ${lastName}`);

  // Navigate to search page
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });
  await sleep(2000);

  // Fill in search form
  await page.type('#firstOrPreferredName', firstName);
  await page.type('#lastName', lastName);

  // Click search button
  await page.click('button[type="submit"]:not([id="MobileNonContextBasedMenu"])');
  await sleep(3000);

  // Check if results found
  const resultsText = await page.evaluate(() => {
    return document.body.textContent;
  });

  if (resultsText.includes('0 Results')) {
    console.log('No results found');
    return null;
  }

  // Click "SEE RESULTS" button
  console.log('Clicking SEE RESULTS button...');
  await sleep(2000);

  // Wait for and click the "See Results" button
  const seeResultsClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const seeResultsBtn = buttons.find(btn => btn.textContent.includes('See Results') || btn.textContent.includes('SEE RESULTS'));
    if (seeResultsBtn) {
      seeResultsBtn.click();
      return true;
    }
    return false;
  });

  if (!seeResultsClicked) {
    throw new Error('SEE RESULTS button not found');
  }

  await sleep(5000);

  // Check for error page
  const hasError = await page.evaluate(() => {
    return document.body.textContent.includes('An unexpected error occurred');
  });

  if (hasError) {
    console.log('Error page detected, trying direct URL approach...');
    return null;
  }

  console.log('Successfully navigated to timing results');
  return true;
}

/**
 * Extract timing data from current page
 */
async function extractTimingData(page) {
  console.log('Extracting timing data...');

  await page.waitForSelector('table', { timeout: WAIT_TIMEOUT });

  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));

    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));

      if (cells.length < 7) return null;

      return {
        event: cells[0]?.textContent.trim() || '',
        swimTime: cells[1]?.textContent.trim() || '',
        age: cells[2]?.textContent.trim() || '',
        points: cells[3]?.textContent.trim() || '',
        timeStandard: cells[4]?.textContent.trim() || '',
        meet: cells[5]?.textContent.trim() || '',
        lsc: cells[6]?.textContent.trim() || '',
        team: cells[7]?.textContent.trim() || '',
        swimDate: cells[8]?.textContent.trim() || ''
      };
    }).filter(row => row !== null);
  });

  console.log(`Extracted ${data.length} timing records`);
  return data;
}

/**
 * Get available competition years from dropdown
 */
async function getAvailableYears(page) {
  const years = await page.evaluate(() => {
    const select = document.querySelector('select[name="competitionYear"]');
    if (!select) return [];

    return Array.from(select.options).map(opt => opt.value);
  });

  return years.filter(y => y && y !== '--');
}

/**
 * Change competition year
 */
async function changeYear(page, year) {
  console.log(`Changing to year: ${year}`);

  await page.select('select[name="competitionYear"]', year);
  await sleep(3000);
}

/**
 * Scrape all data for a swimmer across all years
 */
async function scrapeSwimmer(firstName, lastName) {
  const browser = await initBrowser();
  const page = await browser.newPage();

  try {
    // Search for swimmer
    const searchSuccess = await searchSwimmer(page, firstName, lastName);

    if (!searchSuccess) {
      console.log('Failed to navigate to timing results page');
      await browser.close();
      return { success: false, error: 'Navigation failed' };
    }

    // Get available years
    const years = await getAvailableYears(page);
    console.log(`Found ${years.length} competition years:`, years);

    // Collect data from all years
    const allData = [];

    for (const year of years) {
      await changeYear(page, year);
      const yearData = await extractTimingData(page);

      // Add year to each record
      yearData.forEach(record => {
        record.competitionYear = year;
      });

      allData.push(...yearData);
    }

    console.log(`Total records collected: ${allData.length}`);

    // Save to file
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const filename = `${firstName}_${lastName}_${Date.now()}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(allData, null, 2));

    console.log(`Data saved to: ${filepath}`);

    await browser.close();

    return { success: true, data: allData, filepath };

  } catch (error) {
    console.error('Scraping error:', error);
    await browser.close();
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node scrape_usa_swimming.js "FirstName" "LastName"');
    process.exit(1);
  }

  const [firstName, lastName] = args;

  const result = await scrapeSwimmer(firstName, lastName);

  if (result.success) {
    console.log('✅ Scraping completed successfully');
    console.log(`📄 Output file: ${result.filepath}`);
    console.log(`📊 Total records: ${result.data.length}`);
  } else {
    console.log('❌ Scraping failed:', result.error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scrapeSwimmer };
