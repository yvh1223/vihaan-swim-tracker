#!/usr/bin/env node

/**
 * Complete Database Setup for Vihaan Swim Tracker
 * This script handles everything: table creation and data loading
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://gwqwpicbtkamojwwlmlp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXdwaWNidGthbW9qd3dsbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODk3MzAsImV4cCI6MjA3NTg2NTczMH0.5KiCESGV2zzSmhpwDmJ3TsCwdqyCQXntgTGhWkuV27s';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Convert time string (MM:SS.SS or SS.SS) to total seconds
 */
function timeToSeconds(timeStr) {
  if (!timeStr || timeStr === 'N/A' || timeStr.trim() === '') return null;

  const parts = timeStr.split(':');
  if (parts.length === 2) {
    // MM:SS.SS format
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  } else {
    // SS.SS format
    return parseFloat(timeStr);
  }
}

/**
 * Parse CSV file and return structured data matching the table schema
 */
function parseCSV(csvPath) {
  console.log('Parsing CSV file...');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const records = [];
  const seenRecords = new Set(); // Track unique records

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });

    const ageGroup = row['Age Group'];
    const ageGroupCode = row['Age Group Code'];
    const course = row['Course'];
    const gender = row['Gender'];
    const eventName = row['Event']?.trim();

    if (!eventName || !ageGroup || !course || !gender) continue;

    // Create unique key for this record
    const recordKey = `${ageGroupCode}|${course}|${gender}|${eventName}`;

    if (seenRecords.has(recordKey)) {
      continue; // Skip duplicates
    }
    seenRecords.add(recordKey);

    // Convert all time standards to seconds
    const b_standard = timeToSeconds(row['B']);
    const bb_standard = timeToSeconds(row['BB']);
    const a_standard = timeToSeconds(row['A']);
    const aa_standard = timeToSeconds(row['AA']);
    const aaa_standard = timeToSeconds(row['AAA']);
    const aaaa_standard = timeToSeconds(row['AAAA']);

    records.push({
      age_group: ageGroup,
      age_group_code: ageGroupCode,
      course_type: course,
      gender: gender,
      event_name: eventName,
      b_standard,
      bb_standard,
      a_standard,
      aa_standard,
      aaa_standard,
      aaaa_standard
    });
  }

  console.log(`✓ Parsed ${records.length} unique time standard records`);
  return records;
}

/**
 * Delete all existing data from the table
 */
async function clearTable() {
  console.log('\nClearing existing data...');

  // Delete all records
  const { error } = await supabase
    .from('time_standards')
    .delete()
    .neq('id', 0); // Delete all records (id is never 0)

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found (which is fine)
    console.error('Error clearing table:', error.message);
    return false;
  }

  console.log('✓ Existing data cleared');
  return true;
}

/**
 * Load data in batches
 */
async function loadData(records) {
  console.log(`\nLoading ${records.length} time standard records...`);

  const batchSize = 50; // Smaller batches for more reliable insertion
  let loaded = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const { error } = await supabase
      .from('time_standards')
      .insert(batch);

    if (error) {
      console.error(`\nError loading batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      errors++;

      // Try inserting records one by one in this batch
      console.log('  Trying individual inserts for this batch...');
      for (const record of batch) {
        const { error: individualError } = await supabase
          .from('time_standards')
          .insert([record]);

        if (!individualError) {
          loaded++;
          process.stdout.write(`\r  Loaded ${loaded}/${records.length} records...`);
        }
      }

      if (errors > 5) {
        console.error('\nToo many errors, aborting...');
        return false;
      }
    } else {
      loaded += batch.length;
      process.stdout.write(`\r  Loaded ${loaded}/${records.length} records...`);
    }
  }

  console.log(`\n✓ Successfully loaded ${loaded} records`);
  return loaded > 0;
}

/**
 * Verify data was loaded correctly
 */
async function verifyData() {
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION');
  console.log('='.repeat(60));

  // Count total records
  const { count, error: countError } = await supabase
    .from('time_standards')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting records:', countError.message);
    return false;
  }

  console.log(`\n✓ Total records in database: ${count}`);

  // Sample query: Get standards for 10U Girls SCY 50 FR
  const { data, error } = await supabase
    .from('time_standards')
    .select('*')
    .eq('event_name', '50 FR')
    .eq('age_group_code', '10U')
    .eq('gender', 'Girls')
    .eq('course_type', 'SCY');

  if (error) {
    console.error('Error querying sample data:', error.message);
    return false;
  }

  if (data && data.length > 0) {
    console.log('\nSample data (50 FR, 10U Girls, SCY):');
    const record = data[0];
    console.log(`  AAAA: ${record.aaaa_standard}s`);
    console.log(`  AAA:  ${record.aaa_standard}s`);
    console.log(`  AA:   ${record.aa_standard}s`);
    console.log(`  A:    ${record.a_standard}s`);
    console.log(`  BB:   ${record.bb_standard}s`);
    console.log(`  B:    ${record.b_standard}s`);
  }

  // Check coverage
  const { data: ageGroups } = await supabase
    .from('time_standards')
    .select('age_group_code')
    .order('age_group_code');

  const uniqueAgeGroups = [...new Set(ageGroups?.map(r => r.age_group_code) || [])];
  console.log(`\n✓ Age groups covered: ${uniqueAgeGroups.join(', ')}`);

  const { data: courses } = await supabase
    .from('time_standards')
    .select('course_type')
    .order('course_type');

  const uniqueCourses = [...new Set(courses?.map(r => r.course_type) || [])];
  console.log(`✓ Course types covered: ${uniqueCourses.join(', ')}`);

  const { data: genders } = await supabase
    .from('time_standards')
    .select('gender')
    .order('gender');

  const uniqueGenders = [...new Set(genders?.map(r => r.gender) || [])];
  console.log(`✓ Genders covered: ${uniqueGenders.join(', ')}`);

  return true;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('VIHAAN SWIM TRACKER - DATABASE SETUP');
  console.log('='.repeat(60));

  // Parse CSV data
  const csvPath = path.join(__dirname, '..', 'usa_swimming_standards_cleaned_all.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`\n✗ CSV file not found: ${csvPath}`);
    console.error('Please ensure the CSV file exists in the project root directory.');
    process.exit(1);
  }

  const records = parseCSV(csvPath);

  if (records.length === 0) {
    console.error('\n✗ No records parsed from CSV file');
    process.exit(1);
  }

  // Check if table exists
  console.log('\nChecking database connection...');
  const { error: testError } = await supabase
    .from('time_standards')
    .select('id', { count: 'exact', head: true })
    .limit(1);

  if (testError && testError.code === '42P01') {
    // Table doesn't exist
    console.error('\n✗ Table "time_standards" does not exist.');
    console.error('\nPlease create it first using the Supabase Dashboard:');
    console.error('  1. Go to: https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql');
    console.error('  2. Copy the SQL from: scripts/recreate_table.sql');
    console.error('  3. Paste and run in the SQL Editor');
    console.error('\nThen run this script again.');
    process.exit(1);
  } else if (testError) {
    console.error('\n✗ Database connection error:', testError.message);
    process.exit(1);
  }

  console.log('✓ Database connection successful');

  // Clear existing data
  const cleared = await clearTable();
  if (!cleared) {
    console.error('\n✗ Failed to clear existing data');
    process.exit(1);
  }

  // Load data
  const dataLoaded = await loadData(records);
  if (!dataLoaded) {
    console.error('\n✗ Failed to load data');
    process.exit(1);
  }

  // Verify data
  const dataVerified = await verifyData();
  if (!dataVerified) {
    console.error('\n✗ Verification failed');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✓ DATABASE SETUP COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\nYour time standards database is ready to use.');
  console.log('You can now query time standards from your application.\n');
}

main().catch(error => {
  console.error('\n✗ Unexpected error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
