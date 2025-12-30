#!/usr/bin/env node

/**
 * ABOUTME: Batch loads scraped JSON files to Supabase
 * Uses smaller batches to avoid SQL size limits
 */

const fs = require('fs').promises;
const path = require('path');

async function parseEventName(eventName) {
  const parts = eventName.trim().split(/\s+/);
  if (parts.length < 3) return { distance: null, stroke: null, course: null };
  return { distance: parseInt(parts[0]), stroke: parts[1], course: parts[2] };
}

function timeToSeconds(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length === 1) return parseFloat(parts[0]);
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return null;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function escapeSql(str) {
  if (!str) return null;
  return str.replace(/'/g, "''");
}

async function generateBatchedInserts(jsonFile, swimmerId, batchSize = 50) {
  const data = await fs.readFile(jsonFile, 'utf8');
  const records = JSON.parse(data);

  console.log(`📊 Processing ${records.length} records for swimmer ID ${swimmerId}...`);

  const batches = [];
  let currentBatch = [];

  for (const record of records) {
    const { distance, stroke, course } = await parseEventName(record.event);
    const timeSeconds = timeToSeconds(record.swimTime);
    const eventDate = parseDate(record.swimDate);

    if (!timeSeconds || !eventDate) continue;

    const value = `(${swimmerId}, '${escapeSql(record.event)}', ${record.meet ? `'${escapeSql(record.meet)}'` : 'NULL'}, '${eventDate}', '${escapeSql(record.swimTime)}', ${timeSeconds}, ${course ? `'${course}'` : 'NULL'}, ${distance ? `'${distance}'` : 'NULL'}, ${stroke ? `'${stroke}'` : 'NULL'}, ${record.timeStandard ? `'${escapeSql(record.timeStandard)}'` : 'NULL'}, ${record.points ? parseInt(record.points) : 'NULL'}, ${record.lsc ? `'${escapeSql(record.lsc)}'` : 'NULL'}, ${record.team ? `'${escapeSql(record.team)}'` : 'NULL'}, ${record.age ? parseInt(record.age) : 'NULL'}, NOW(), NOW())`;

    currentBatch.push(value);

    if (currentBatch.length >= batchSize) {
      batches.push(currentBatch);
      currentBatch = [];
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

async function main() {
  const [jsonFile, swimmerId] = process.argv.slice(2);

  if (!jsonFile || !swimmerId) {
    console.error('Usage: node batch_load_json.js <json-file> <swimmer-id>');
    process.exit(1);
  }

  const batches = await generateBatchedInserts(jsonFile, parseInt(swimmerId));

  console.log(`✅ Generated ${batches.length} batches`);
  console.log(`\n-- COPY THE SQL STATEMENTS BELOW --\n`);

  batches.forEach((batch, idx) => {
    const sql = `
-- Batch ${idx + 1}/${batches.length}
INSERT INTO competition_results (swimmer_id, event_name, meet_name, event_date, time_formatted, time_seconds, course_type, distance, stroke, time_standard, points, lsc, team, age, created_at, updated_at)
VALUES ${batch.join(', ')}
ON CONFLICT (swimmer_id, event_name, event_date, COALESCE(meet_name, '')) DO NOTHING;
`;
    console.log(sql);
  });
}

main();
