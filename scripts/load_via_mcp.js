#!/usr/bin/env node

/**
 * ABOUTME: Loads scraped USA Swimming data to Supabase via MCP
 * Generates SQL INSERT statements with duplicate detection
 */

const fs = require('fs').promises;

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

// Generate SQL INSERT statements
async function generateInsertSQL(jsonFile, swimmerId) {
  const data = await fs.readFile(jsonFile, 'utf8');
  const records = JSON.parse(data);

  console.log(`\n📊 Processing ${records.length} records for swimmer ID ${swimmerId}...`);

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
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error('Usage: node load_via_mcp.js <json-file> <swimmer-id>');
    process.exit(1);
  }

  const [jsonFile, swimmerId] = args;

  try {
    const result = await generateInsertSQL(jsonFile, parseInt(swimmerId));

    if (!result) {
      process.exit(1);
    }

    console.log(`\n✅ Generated SQL for ${result.validRecords}/${result.totalRecords} records`);
    console.log('\n--- SQL OUTPUT ---');
    console.log(result.sql);
    console.log('--- END SQL ---\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
