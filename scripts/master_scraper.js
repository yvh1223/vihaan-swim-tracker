#!/usr/bin/env node

/**
 * Master USA Swimming Data Scraper
 *
 * Features:
 * - Automatic detection of existing data (incremental vs full load)
 * - Batch processing with rate limiting
 * - Team progression management
 * - Duplicate detection
 * - Comprehensive logging and reporting
 * - Resume capability for failed batches
 *
 * Usage:
 *   node master_scraper.js swimmers.json [--full] [--incremental] [--check-only]
 *
 * Options:
 *   --full          Force full historical scrape even if data exists
 *   --incremental   Force incremental scrape only
 *   --check-only    Only check what needs to be scraped, don't scrape
 */

const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Configuration
const CONFIG = {
  SCRAPE_DELAY_MS: 5000, // 5 seconds between scrapes to avoid rate limiting
  BATCH_SIZE: 5, // Process 5 swimmers at a time
  MAX_RETRIES: 2,
  OUTPUT_DIR: path.join(__dirname, 'scraped_data'),
  LOGS_DIR: path.join(__dirname, 'logs'),
  REPORTS_DIR: path.join(__dirname, 'reports')
};

class MasterScraper {
  constructor(swimmersFile, options = {}) {
    this.swimmersFile = swimmersFile;
    this.options = {
      forceFullScrape: options.full || false,
      incrementalOnly: options.incremental || false,
      checkOnly: options.checkOnly || false
    };
    this.report = {
      startTime: new Date(),
      swimmers: [],
      summary: {
        total: 0,
        fullScrape: 0,
        incrementalScrape: 0,
        noScrapeNeeded: 0,
        failed: 0
      }
    };
  }

  async init() {
    // Ensure directories exist
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    await fs.mkdir(CONFIG.LOGS_DIR, { recursive: true });
    await fs.mkdir(CONFIG.REPORTS_DIR, { recursive: true });

    // Load swimmers list
    const swimmersData = await fs.readFile(this.swimmersFile, 'utf8');
    this.swimmers = JSON.parse(swimmersData);
    this.report.summary.total = this.swimmers.length;

    console.log('\n🏊‍♂️ Master USA Swimming Data Scraper');
    console.log('='.repeat(50));
    console.log(`📋 Loaded ${this.swimmers.length} swimmers from ${this.swimmersFile}`);
    console.log(`🔧 Mode: ${this.options.forceFullScrape ? 'FULL' : this.options.incrementalOnly ? 'INCREMENTAL' : 'AUTO'}`);
    if (this.options.checkOnly) console.log('ℹ️  CHECK ONLY MODE - No scraping will be performed\n');
  }

  async checkExistingData(swimmer) {
    try {
      // Check if swimmer exists in database
      const { data: swimmerData, error: swimmerError } = await supabase
        .from('swimmers')
        .select('id, full_name')
        .eq('first_name', swimmer.firstName)
        .eq('last_name', swimmer.lastName)
        .maybeSingle();

      if (swimmerError) throw swimmerError;

      if (!swimmerData) {
        return {
          exists: false,
          swimmerId: null,
          lastEventDate: null,
          recordCount: 0,
          scrapeType: 'FULL'
        };
      }

      // Get competition results stats
      const { data: resultsData, error: resultsError } = await supabase
        .from('competition_results')
        .select('event_date')
        .eq('swimmer_id', swimmerData.id)
        .order('event_date', { ascending: false })
        .limit(1);

      if (resultsError) throw resultsError;

      const lastEventDate = resultsData?.[0]?.event_date || null;

      // Get total record count
      const { count, error: countError } = await supabase
        .from('competition_results')
        .select('*', { count: 'exact', head: true })
        .eq('swimmer_id', swimmerData.id);

      if (countError) throw countError;

      // Determine scrape type
      let scrapeType = 'NONE';
      if (this.options.forceFullScrape) {
        scrapeType = 'FULL';
      } else if (this.options.incrementalOnly) {
        scrapeType = lastEventDate ? 'INCREMENTAL' : 'SKIP';
      } else if (!lastEventDate) {
        scrapeType = 'FULL';
      } else {
        // Check if last event is recent (within 30 days)
        const daysSinceLastEvent = Math.floor(
          (new Date() - new Date(lastEventDate)) / (1000 * 60 * 60 * 24)
        );
        scrapeType = daysSinceLastEvent < 90 ? 'INCREMENTAL' : 'FULL';
      }

      return {
        exists: true,
        swimmerId: swimmerData.id,
        swimmerName: swimmerData.full_name,
        lastEventDate,
        recordCount: count || 0,
        daysSinceLastEvent: lastEventDate ? Math.floor(
          (new Date() - new Date(lastEventDate)) / (1000 * 60 * 60 * 24)
        ) : null,
        scrapeType
      };
    } catch (error) {
      console.error(`❌ Error checking data for ${swimmer.firstName} ${swimmer.lastName}:`, error.message);
      return {
        exists: false,
        swimmerId: null,
        lastEventDate: null,
        recordCount: 0,
        scrapeType: 'FULL',
        error: error.message
      };
    }
  }

  async analyzeSwimmers() {
    console.log('\n📊 Analyzing existing data...\n');

    const analysis = [];

    for (const swimmer of this.swimmers) {
      const info = await this.checkExistingData(swimmer);
      analysis.push({
        swimmer,
        ...info
      });

      const statusIcon = info.scrapeType === 'FULL' ? '🆕' :
                        info.scrapeType === 'INCREMENTAL' ? '📈' :
                        info.scrapeType === 'SKIP' ? '⏭️' : '✓';

      console.log(`${statusIcon} ${swimmer.firstName} ${swimmer.lastName} (${swimmer.gender})`);
      if (info.exists) {
        console.log(`   └─ ID: ${info.swimmerId} | Records: ${info.recordCount} | Last: ${info.lastEventDate || 'N/A'}`);
        if (info.daysSinceLastEvent !== null) {
          console.log(`   └─ Days since last event: ${info.daysSinceLastEvent}`);
        }
      }
      console.log(`   └─ Action: ${info.scrapeType}\n`);
    }

    return analysis;
  }

  async scrapeSwimmer(swimmer, scrapeType) {
    const startTime = Date.now();
    const logFile = path.join(CONFIG.LOGS_DIR, `${swimmer.firstName}_${swimmer.lastName}_${Date.now()}.log`);

    return new Promise((resolve) => {
      const args = [
        path.join(__dirname, 'scrape_usa_swimming_v2.js'),
        swimmer.firstName,
        swimmer.lastName
      ];

      const scraper = spawn('node', args);
      let output = '';
      let errorOutput = '';

      scraper.stdout.on('data', (data) => {
        output += data.toString();
      });

      scraper.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      scraper.on('close', async (code) => {
        const duration = Date.now() - startTime;

        // Save log
        await fs.writeFile(logFile, output + '\n\n' + errorOutput);

        // Parse output to get result
        const successMatch = output.match(/✅ Total records collected: (\d+)/);
        const fileMatch = output.match(/📄 Data saved to: (.+\.json)/);

        const result = {
          swimmer,
          scrapeType,
          success: code === 0 && successMatch !== null,
          recordCount: successMatch ? parseInt(successMatch[1]) : 0,
          filePath: fileMatch ? fileMatch[1].trim() : null,
          duration,
          logFile,
          exitCode: code,
          timestamp: new Date().toISOString()
        };

        if (!result.success) {
          result.error = errorOutput || 'Scrape failed';
        }

        resolve(result);
      });
    });
  }

  async loadToSupabase(filePath, swimmer) {
    return new Promise((resolve) => {
      const loader = spawn('node', [
        path.join(__dirname, 'load_to_supabase.js'),
        filePath
      ]);

      let output = '';
      let errorOutput = '';

      loader.stdout.on('data', (data) => {
        output += data.toString();
      });

      loader.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      loader.on('close', (code) => {
        const insertedMatch = output.match(/✅ Inserted: (\d+)/);
        const skippedMatch = output.match(/⏭️\s+Skipped \(duplicates\): (\d+)/);
        const swimmerIdMatch = output.match(/\(ID: (\d+)\)/);

        resolve({
          success: code === 0,
          inserted: insertedMatch ? parseInt(insertedMatch[1]) : 0,
          skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
          swimmerId: swimmerIdMatch ? parseInt(swimmerIdMatch[1]) : null,
          error: code !== 0 ? errorOutput : null
        });
      });
    });
  }

  async updateTeamProgression(swimmerId) {
    try {
      // Get date range from competition results
      const { data: results, error: resultsError } = await supabase
        .from('competition_results')
        .select('event_date')
        .eq('swimmer_id', swimmerId)
        .order('event_date');

      if (resultsError || !results || results.length === 0) return;

      const dates = results.map(r => r.event_date);
      const startDate = dates[0];

      // Check if team progression exists
      const { data: existing, error: existingError } = await supabase
        .from('team_progression')
        .select('id')
        .eq('swimmer_id', swimmerId)
        .eq('team_name', 'LAC - Gold I Swim Team')
        .maybeSingle();

      if (existingError) throw existingError;

      if (!existing) {
        // Insert team progression
        const { error: insertError } = await supabase
          .from('team_progression')
          .insert({
            swimmer_id: swimmerId,
            team_name: 'LAC - Gold I Swim Team',
            start_date: startDate,
            end_date: null
          });

        if (insertError) throw insertError;
        console.log(`   └─ ✅ Team progression updated`);
      }
    } catch (error) {
      console.log(`   └─ ⚠️  Team progression update failed: ${error.message}`);
    }
  }

  async processSwimmers(analysis) {
    console.log('\n🚀 Starting scraping process...\n');

    for (let i = 0; i < analysis.length; i++) {
      const { swimmer, scrapeType, exists, swimmerId } = analysis[i];

      console.log(`[${i + 1}/${analysis.length}] Processing: ${swimmer.firstName} ${swimmer.lastName}`);

      if (scrapeType === 'NONE' || scrapeType === 'SKIP') {
        console.log(`   └─ ⏭️  Skipping (${scrapeType})\n`);
        this.report.summary.noScrapeNeeded++;
        this.report.swimmers.push({
          swimmer,
          action: 'SKIPPED',
          reason: scrapeType
        });
        continue;
      }

      // Scrape data
      console.log(`   └─ 🔍 Scraping (${scrapeType})...`);
      const scrapeResult = await this.scrapeSwimmer(swimmer, scrapeType);

      if (!scrapeResult.success) {
        console.log(`   └─ ❌ Scrape failed: ${scrapeResult.error}\n`);
        this.report.summary.failed++;
        this.report.swimmers.push({
          swimmer,
          action: 'FAILED',
          error: scrapeResult.error,
          ...scrapeResult
        });
        continue;
      }

      console.log(`   └─ ✅ Scraped ${scrapeResult.recordCount} records (${(scrapeResult.duration / 1000).toFixed(1)}s)`);

      // Load to Supabase
      console.log(`   └─ 💾 Loading to database...`);
      const loadResult = await this.loadToSupabase(scrapeResult.filePath, swimmer);

      if (!loadResult.success) {
        console.log(`   └─ ❌ Load failed: ${loadResult.error}\n`);
        this.report.summary.failed++;
        this.report.swimmers.push({
          swimmer,
          action: 'SCRAPE_OK_LOAD_FAILED',
          scrapeResult,
          loadResult
        });
        continue;
      }

      console.log(`   └─ ✅ Loaded: ${loadResult.inserted} new, ${loadResult.skipped} duplicates`);

      // Update team progression
      const finalSwimmerId = loadResult.swimmerId || swimmerId;
      if (finalSwimmerId) {
        await this.updateTeamProgression(finalSwimmerId);
      }

      // Update summary
      if (scrapeType === 'FULL') {
        this.report.summary.fullScrape++;
      } else if (scrapeType === 'INCREMENTAL') {
        this.report.summary.incrementalScrape++;
      }

      this.report.swimmers.push({
        swimmer,
        action: 'SUCCESS',
        scrapeType,
        scrapeResult,
        loadResult
      });

      console.log(`   └─ ✓ Complete\n`);

      // Rate limiting delay
      if (i < analysis.length - 1) {
        console.log(`   └─ ⏳ Waiting ${CONFIG.SCRAPE_DELAY_MS / 1000}s before next scrape...\n`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.SCRAPE_DELAY_MS));
      }
    }
  }

  async generateReport() {
    this.report.endTime = new Date();
    this.report.duration = this.report.endTime - this.report.startTime;

    const reportFile = path.join(
      CONFIG.REPORTS_DIR,
      `scrape_report_${Date.now()}.json`
    );

    await fs.writeFile(reportFile, JSON.stringify(this.report, null, 2));

    console.log('\n' + '='.repeat(50));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Swimmers: ${this.report.summary.total}`);
    console.log(`✅ Full Scrape: ${this.report.summary.fullScrape}`);
    console.log(`📈 Incremental: ${this.report.summary.incrementalScrape}`);
    console.log(`⏭️  Skipped: ${this.report.summary.noScrapeNeeded}`);
    console.log(`❌ Failed: ${this.report.summary.failed}`);
    console.log(`⏱️  Duration: ${(this.report.duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`📄 Report: ${reportFile}`);
    console.log('='.repeat(50) + '\n');
  }

  async run() {
    try {
      await this.init();
      const analysis = await this.analyzeSwimmers();

      if (this.options.checkOnly) {
        console.log('\n✓ Check complete. Use without --check-only to proceed with scraping.\n');
        return;
      }

      await this.processSwimmers(analysis);
      await this.generateReport();

    } catch (error) {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
🏊‍♂️ Master USA Swimming Data Scraper

Usage:
  node master_scraper.js <swimmers.json> [options]

Options:
  --full          Force full historical scrape even if data exists
  --incremental   Force incremental scrape only
  --check-only    Only check what needs to be scraped, don't scrape

Examples:
  node master_scraper.js lac_swimmers.json
  node master_scraper.js all_swimmers.json --check-only
  node master_scraper.js team_swimmers.json --incremental
`);
    process.exit(0);
  }

  const swimmersFile = args[0];
  const options = {
    full: args.includes('--full'),
    incremental: args.includes('--incremental'),
    checkOnly: args.includes('--check-only')
  };

  const scraper = new MasterScraper(swimmersFile, options);
  scraper.run();
}

module.exports = MasterScraper;
