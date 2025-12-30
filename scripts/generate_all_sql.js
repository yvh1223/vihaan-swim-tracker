#!/usr/bin/env node

/**
 * ABOUTME: Generates consolidated SQL for all scraped swimmers
 */

const fs = require('fs').promises;
const path = require('path');

// Swimmer ID mapping
const swimmerIds = {
  'Asa_Davidson': 9,
  'Audrey_Gerard': 12,
  'Austin_Deng': 10,
  'Brooke_Long': 24,
  'Darren_Xu': 20,
  'Eileen_Zheng': 15,
  'Emie_Dibrito': 17,
  'Finley_Payne': 13,
  'Jason_Ma': 25,
  'Jeremy_Ting': 19,
  'Kiaan_Patel': 23,
  'Mia_Abareta': 8,
  'Nathanel_Gelbman': 11,
  'Parker_Li': 21,
  'Parker_Sprawls': 14,
  'Scarlett_Mann': 22,
  'Serena_Tsao': 7,
  'Swara_Chitre': 3,
  'Vihaan_Huchchannavar': 1,
  'Vivian_Habern': 16,
  'Vivienne_Suhor': 18,
  'William_Power': 26
};

// Parse event name to extract distance, stroke, and course
function parseEventName(eventName) {
  const parts = eventName.trim().split(/\s+/);
  if (parts.length < 3) {
    return { distance: null, stroke: null, course: null };
  }
  return {
    distance: parseInt(parts[0]),
    stroke: parts[1],
    course: parts[2]
  };
}

// Convert time string to seconds
function timeToSeconds(timeStr) {
  if (!timeStr || timeStr === '') return null;
  // Remove 'r' suffix for relay leadoff times
  timeStr = timeStr.replace(/r$/, '');
  const parts = timeStr.split(':');
  if (parts.length === 1) {
    return parseFloat(parts[0]);
  } else if (parts.length === 2) {
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return null;
}

// Parse date from USA Swimming format
function parseDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  try {
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error.message);
    return null;
  }
}

// Escape single quotes for SQL
function escapeSql(str) {
  if (!str) return null;
  return str.replace(/'/g, "''");
}

// Generate SQL INSERT statements for one swimmer
async function generateInsertSQL(jsonFile, swimmerId, swimmerName) {
  const data = await fs.readFile(jsonFile, 'utf8');
  const records = JSON.parse(data);

  console.log(`\n📊 Processing ${records.length} records for ${swimmerName} (ID: ${swimmerId})...`);

  const values = [];

  for (const record of records) {
    const { distance, stroke, course } = parseEventName(record.event);
    const timeSeconds = timeToSeconds(record.swimTime);
    const eventDate = parseDate(record.swimDate);

    if (!timeSeconds || !eventDate) {
      console.log(`⚠️  Skipping invalid record: ${record.event} on ${record.swimDate}`);
      continue;
    }

    const eventName = escapeSql(record.event);
    const meetName = escapeSql(record.meet);
    const timeFormatted = escapeSql(record.swimTime);
    const timeStandard = escapeSql(record.timeStandard);
    const lsc = escapeSql(record.lsc);
    const team = escapeSql(record.team);

    const value = `(
      ${swimmerId},
      '${eventName}',
      ${meetName ? `'${meetName}'` : 'NULL'},
      '${eventDate}',
      '${timeFormatted}',
      ${timeSeconds},
      ${course ? `'${course}'` : 'NULL'},
      ${distance ? `'${distance}'` : 'NULL'},
      ${stroke ? `'${stroke}'` : 'NULL'},
      ${timeStandard ? `'${timeStandard}'` : 'NULL'},
      ${record.points ? parseInt(record.points) : 'NULL'},
      ${lsc ? `'${lsc}'` : 'NULL'},
      ${team ? `'${team}'` : 'NULL'},
      ${record.age ? parseInt(record.age) : 'NULL'},
      NOW(),
      NOW()
    )`;

    values.push(value);
  }

  if (values.length === 0) {
    console.log('❌ No valid records to insert');
    return null;
  }

  // Use bulk INSERT with ON CONFLICT to skip duplicates
  const sql = `
-- ${swimmerName} (${values.length} records)
INSERT INTO competition_results (
  swimmer_id, event_name, meet_name, event_date, time_formatted,
  time_seconds, course_type, distance, stroke, time_standard,
  points, lsc, team, age, created_at, updated_at
)
VALUES
${values.join(',\n')}
ON CONFLICT (swimmer_id, event_name, event_date, COALESCE(meet_name, ''))
DO NOTHING;
`;

  return { sql, totalRecords: records.length, validRecords: values.length };
}

// Main
async function main() {
  const scrapedDir = path.join(__dirname, 'scraped_data');
  const files = await fs.readdir(scrapedDir);

  // Filter for Dec 30 files only (timestamp 1767...)
  const recentFiles = files.filter(f => f.includes('1767') && f.endsWith('.json'));

  console.log(`\n🔄 Processing ${recentFiles.length} scraped files...\n`);

  const allSql = [];
  const stats = { total: 0, valid: 0, swimmers: 0 };

  for (const file of recentFiles.sort()) {
    // Extract swimmer name from filename (e.g., "Asa_Davidson_1767121160794.json")
    const swimmerKey = file.replace(/_\d+\.json$/, '');
    const swimmerId = swimmerIds[swimmerKey];

    if (!swimmerId) {
      console.error(`❌ Unknown swimmer: ${swimmerKey}`);
      continue;
    }

    const filePath = path.join(scrapedDir, file);
    const result = await generateInsertSQL(filePath, swimmerId, swimmerKey.replace(/_/g, ' '));

    if (result) {
      allSql.push(result.sql);
      stats.total += result.totalRecords;
      stats.valid += result.validRecords;
      stats.swimmers++;
      console.log(`✅ Generated SQL: ${result.validRecords}/${result.totalRecords} records`);
    }
  }

  // Write consolidated SQL file
  const outputFile = path.join(__dirname, 'load_all_swimmers.sql');
  const header = `-- ═══════════════════════════════════════════════════
-- CONSOLIDATED SQL FOR ALL SWIMMERS
-- Generated: ${new Date().toISOString()}
-- Total swimmers: ${stats.swimmers}
-- Total records: ${stats.valid} valid out of ${stats.total}
-- ═══════════════════════════════════════════════════

`;

  await fs.writeFile(outputFile, header + allSql.join('\n\n'));

  console.log(`\n${'═'.repeat(55)}`);
  console.log(`✅ SQL GENERATION COMPLETE`);
  console.log(`${'═'.repeat(55)}`);
  console.log(`📊 Statistics:`);
  console.log(`   • Swimmers processed: ${stats.swimmers}/22`);
  console.log(`   • Total records: ${stats.total}`);
  console.log(`   • Valid records: ${stats.valid}`);
  console.log(`   • Output file: ${outputFile}`);
  console.log(`${'═'.repeat(55)}\n`);
  console.log(`🚀 NEXT STEPS:`);
  console.log(`   1. Open Supabase SQL Editor`);
  console.log(`   2. Paste contents of ${path.basename(outputFile)}`);
  console.log(`   3. Execute the SQL`);
  console.log(`   4. Duplicates will be automatically skipped (ON CONFLICT DO NOTHING)`);
  console.log(`${'═'.repeat(55)}\n`);
}

main().catch(console.error);
