/**
 * USA Swimming Data Scraper V2 - Improved with debugging
 *
 * Scrapes swimmer timing data from data.usaswimming.org
 * Usage: node scrape_usa_swimming_v2.js "FirstName" "LastName"
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = 'https://data.usaswimming.org/datahub/usas/individualsearch';
const OUTPUT_DIR = path.join(__dirname, 'scraped_data');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const WAIT_TIMEOUT = 15000;
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
      '--disable-blink-features=AutomationControlled',
      '--window-size=1400,1200'
    ],
    defaultViewport: {
      width: 1400,
      height: 1200
    }
  });
}

/**
 * Take screenshot for debugging
 */
async function takeScreenshot(page, name) {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    const filepath = path.join(SCREENSHOT_DIR, `${name}_${Date.now()}.png`);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 Screenshot saved: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('Screenshot error:', error.message);
  }
}

/**
 * Analyze page structure for debugging
 */
async function analyzePage(page, label) {
  console.log(`\n🔍 Analyzing page structure: ${label}`);

  const analysis = await page.evaluate(() => {
    // Find all tables
    const tables = Array.from(document.querySelectorAll('table'));

    // Find all select dropdowns
    const selects = Array.from(document.querySelectorAll('select'));

    // Find all buttons
    const buttons = Array.from(document.querySelectorAll('button'));

    // Get page title
    const title = document.title;

    // Get current URL
    const url = window.location.href;

    return {
      url,
      title,
      tableCount: tables.length,
      tables: tables.map((table, idx) => ({
        index: idx,
        rowCount: table.querySelectorAll('tr').length,
        columnCount: table.querySelectorAll('th').length || table.querySelectorAll('td').length,
        headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim()),
        firstRowData: Array.from(table.querySelectorAll('tbody tr')[0]?.querySelectorAll('td') || []).map(td => td.textContent.trim().substring(0, 50))
      })),
      selectCount: selects.length,
      selects: selects.map((select, idx) => ({
        index: idx,
        name: select.name,
        id: select.id,
        optionCount: select.options.length,
        options: Array.from(select.options).slice(0, 5).map(opt => opt.value)
      })),
      buttonCount: buttons.length
    };
  });

  console.log(JSON.stringify(analysis, null, 2));
  return analysis;
}

/**
 * Search for swimmer by name
 */
async function searchSwimmer(page, firstName, lastName) {
  console.log(`\n🏊 Searching for: ${firstName} ${lastName}`);

  // Navigate to search page
  await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: NAVIGATION_TIMEOUT });
  await sleep(2000);
  await takeScreenshot(page, 'step1_search_page');

  // Fill in search form
  await page.type('#firstOrPreferredName', firstName);
  await page.type('#lastName', lastName);
  await takeScreenshot(page, 'step2_form_filled');

  // Click search button
  await page.click('button[type="submit"]:not([id="MobileNonContextBasedMenu"])');
  await sleep(3000);
  await takeScreenshot(page, 'step3_search_results');

  // Analyze the search results page
  await analyzePage(page, 'Search Results Page');

  // Check if results found
  const resultsText = await page.evaluate(() => {
    return document.body.textContent;
  });

  if (resultsText.includes('0 Results')) {
    console.log('❌ No results found');
    return null;
  }

  console.log('✅ Results found, looking for SEE RESULTS button...');

  // Check for multiple results and select Lakeside Aquatic Club if needed
  await sleep(2000);

  const seeResultsClicked = await page.evaluate(() => {
    // Find all table rows with SEE RESULTS buttons
    const rows = Array.from(document.querySelectorAll('table tbody tr'));

    if (rows.length > 1) {
      console.log(`Found ${rows.length} swimmers, looking for Lakeside Aquatic Club...`);

      // Look for Lakeside Aquatic Club row
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'));
        const clubCell = cells.find(cell => cell.textContent.includes('Lakeside Aquatic Club'));

        if (clubCell) {
          const button = row.querySelector('button');
          if (button && button.textContent.includes('See Results')) {
            console.log('Found Lakeside Aquatic Club swimmer, clicking...');
            button.click();
            return true;
          }
        }
      }

      // If Lakeside not found, click first result
      console.log('Lakeside Aquatic Club not found, using first result');
    }

    // Default: click first SEE RESULTS button
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const seeResultsBtn = buttons.find(btn =>
      btn.textContent.includes('See Results') ||
      btn.textContent.includes('SEE RESULTS') ||
      btn.textContent.includes('Results')
    );

    console.log('Found buttons:', buttons.map(b => b.textContent.trim()));

    if (seeResultsBtn) {
      console.log('Clicking button:', seeResultsBtn.textContent.trim());
      seeResultsBtn.click();
      return true;
    }
    return false;
  });

  if (!seeResultsClicked) {
    console.log('❌ SEE RESULTS button not found');
    return null;
  }

  console.log('✅ Clicked SEE RESULTS button');
  await sleep(5000);
  await takeScreenshot(page, 'step4_timing_results');

  // Check for error page
  const hasError = await page.evaluate(() => {
    return document.body.textContent.includes('An unexpected error occurred');
  });

  if (hasError) {
    console.log('❌ Error page detected');
    return null;
  }

  // Analyze the timing results page
  await analyzePage(page, 'Timing Results Page');

  console.log('✅ Successfully navigated to timing results');
  return true;
}

/**
 * Extract timing data from current page - improved selectors
 */
async function extractTimingData(page, year) {
  console.log(`\n📊 Extracting timing data for year: ${year}...`);

  try {
    // Wait for table
    await page.waitForSelector('table', { timeout: WAIT_TIMEOUT });

    const data = await page.evaluate((year) => {
      const tables = Array.from(document.querySelectorAll('table'));
      console.log(`Found ${tables.length} tables`);

      // Find the table with timing data (usually has headers like EVENT, SWIM TIME, etc.)
      let dataTable = null;
      for (const table of tables) {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim().toUpperCase());
        if (headers.includes('EVENT') || headers.includes('SWIM TIME') || headers.includes('TIME')) {
          dataTable = table;
          break;
        }
      }

      if (!dataTable) {
        console.log('No data table found with EVENT/SWIM TIME headers');
        dataTable = tables[0]; // Fallback to first table
      }

      const rows = Array.from(dataTable.querySelectorAll('tbody tr'));
      console.log(`Found ${rows.length} data rows`);

      return rows.map((row, idx) => {
        const cells = Array.from(row.querySelectorAll('td'));
        console.log(`Row ${idx}: ${cells.length} cells`);

        if (cells.length < 5) return null;

        // Extract data with fallback logic
        const result = {
          event: cells[0]?.textContent.trim() || '',
          swimTime: cells[1]?.textContent.trim() || '',
          age: cells[2]?.textContent.trim() || '',
          points: cells[3]?.textContent.trim() || '',
          timeStandard: cells[4]?.textContent.trim() || '',
          meet: cells[5]?.textContent.trim() || '',
          lsc: cells[6]?.textContent.trim() || '',
          team: cells[7]?.textContent.trim() || '',
          swimDate: cells[8]?.textContent.trim() || '',
          competitionYear: year
        };

        console.log(`Row ${idx} data:`, result);
        return result;
      }).filter(row => row !== null && row.event);
    }, year);

    console.log(`✅ Extracted ${data.length} timing records`);
    return data;

  } catch (error) {
    console.error('❌ Error extracting timing data:', error.message);
    return [];
  }
}

/**
 * Get available competition years from dropdown
 */
async function getAvailableYears(page) {
  console.log('\n📅 Getting available competition years...');

  const years = await page.evaluate(() => {
    // Try different possible selectors
    const selectors = [
      'select[name="competitionYear"]',
      'select#competitionYear',
      'select'
    ];

    for (const selector of selectors) {
      const select = document.querySelector(selector);
      if (select) {
        const options = Array.from(select.options).map(opt => ({
          value: opt.value,
          text: opt.textContent.trim()
        }));
        console.log(`Found select with ${options.length} options using selector: ${selector}`);
        return options;
      }
    }

    console.log('No select found');
    return [];
  });

  const validYears = years.filter(y => y.value && y.value !== '--' && y.value.trim() !== '');
  console.log(`✅ Found ${validYears.length} competition years:`, validYears.map(y => y.value));

  return validYears.map(y => y.value);
}

/**
 * Change competition year
 */
async function changeYear(page, year) {
  console.log(`\n🔄 Changing to year: ${year}`);

  try {
    // Try to find and select the year
    const selected = await page.evaluate((year) => {
      const selectors = [
        'select[name="competitionYear"]',
        'select#competitionYear',
        'select'
      ];

      for (const selector of selectors) {
        const select = document.querySelector(selector);
        if (select) {
          select.value = year;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`Selected year ${year} using selector: ${selector}`);
          return true;
        }
      }

      return false;
    }, year);

    if (!selected) {
      console.log('❌ Could not select year');
      return false;
    }

    await sleep(3000);
    console.log(`✅ Changed to year: ${year}`);
    return true;

  } catch (error) {
    console.error('❌ Error changing year:', error.message);
    return false;
  }
}

/**
 * Scrape all data for a swimmer across all years
 */
async function scrapeSwimmer(firstName, lastName) {
  const browser = await initBrowser();
  const page = await browser.newPage();

  // Enable console logging from page
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    // Search for swimmer
    const searchSuccess = await searchSwimmer(page, firstName, lastName);

    if (!searchSuccess) {
      console.log('❌ Failed to navigate to timing results page');
      await browser.close();
      return { success: false, error: 'Navigation failed' };
    }

    // Get available years
    const years = await getAvailableYears(page);

    if (years.length === 0) {
      console.log('⚠️  No competition years found, extracting current page data...');
      // Try to extract data from current page without year filtering
      const currentData = await extractTimingData(page, 'current');
      console.log(`Found ${currentData.length} records on current page`);

      if (currentData.length > 0) {
        // Save to file
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        const filename = `${firstName}_${lastName}_${Date.now()}.json`;
        const filepath = path.join(OUTPUT_DIR, filename);
        await fs.writeFile(filepath, JSON.stringify(currentData, null, 2));

        console.log(`✅ Data saved to: ${filepath}`);
        await browser.close();

        return { success: true, data: currentData, filepath };
      }
    }

    // Collect data from all years
    const allData = [];
    let consecutiveEmptyYears = 0;

    for (const year of years) {
      const changed = await changeYear(page, year);
      if (!changed) continue;

      const yearData = await extractTimingData(page, year);

      if (yearData.length === 0) {
        consecutiveEmptyYears++;
        console.log(`⚠️  No data for year ${year}, empty count: ${consecutiveEmptyYears}`);

        // Stop if we hit 2 consecutive years with no data
        if (consecutiveEmptyYears >= 2) {
          console.log(`🛑 Stopping: Found ${consecutiveEmptyYears} consecutive years with no data`);
          break;
        }
      } else {
        consecutiveEmptyYears = 0; // Reset counter when we find data
        allData.push(...yearData);
      }
    }

    console.log(`\n✅ Total records collected: ${allData.length}`);

    // Save to file
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const filename = `${firstName}_${lastName}_${Date.now()}.json`;
    const filepath = path.join(OUTPUT_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(allData, null, 2));

    console.log(`📄 Data saved to: ${filepath}`);

    await browser.close();

    return { success: true, data: allData, filepath };

  } catch (error) {
    console.error('\n❌ Scraping error:', error);
    await takeScreenshot(page, 'error');
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
    console.log('Usage: node scrape_usa_swimming_v2.js "FirstName" "LastName"');
    process.exit(1);
  }

  const [firstName, lastName] = args;

  console.log('🏊‍♂️ USA Swimming Data Scraper V2\n');
  console.log('='.repeat(50));

  const result = await scrapeSwimmer(firstName, lastName);

  console.log('\n' + '='.repeat(50));

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
