#!/usr/bin/env node

/**
 * Database Setup Script for Vihaan Swim Tracker
 * Uses direct SQL execution via Supabase REST API
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
  if (!timeStr || timeStr === 'N/A') return null;

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
 * Parse CSV file and return structured data
 */
function parseCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });

    // Parse each time standard (B, BB, A, AA, AAA, AAAA)
    const standards = ['B', 'BB', 'A', 'AA', 'AAA', 'AAAA'];
    const ageGroup = row['Age Group'];
    const course = row['Course'];
    const gender = row['Gender'] === 'Girls' ? 'F' : 'M';
    const event = row['Event']?.trim();

    if (!event) continue;

    standards.forEach(standard => {
      const timeStr = row[standard];
      const timeSeconds = timeToSeconds(timeStr);

      if (timeSeconds !== null) {
        records.push({
          age_group: ageGroup,
          course: course,
          gender: gender,
          event: event,
          time_standard: standard,
          time_seconds: timeSeconds
        });
      }
    });
  }

  return records;
}

/**
 * Check if table exists
 */
async function tableExists() {
  const { data, error } = await supabase
    .from('time_standards')
    .select('id', { count: 'exact', head: true })
    .limit(1);

  return !error || error.code !== '42P01'; // 42P01 = undefined_table
}

/**
 * Load data in batches
 */
async function loadData(records) {
  console.log(`\nLoading ${records.length} time standard records...`);

  const batchSize = 100;
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
      if (errors > 3) {
        console.error('Too many errors, aborting...');
        return false;
      }
    } else {
      loaded += batch.length;
      process.stdout.write(`\r  Loaded ${loaded}/${records.length} records...`);
    }
  }

  console.log(`\n✓ Loaded ${loaded} records successfully`);
  return loaded > 0;
}

/**
 * Verify data was loaded correctly
 */
async function verifyData() {
  console.log('\nVerifying data...');

  // Count total records
  const { count, error: countError } = await supabase
    .from('time_standards')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting records:', countError.message);
    return false;
  }

  console.log(`✓ Total records in database: ${count}`);

  // Sample query: Get 50 FR times for 10U Girls in SCY
  const { data, error } = await supabase
    .from('time_standards')
    .select('*')
    .eq('event', '50 FR')
    .eq('age_group', '10 & under')
    .eq('gender', 'F')
    .eq('course', 'SCY')
    .order('time_seconds');

  if (error) {
    console.error('Error querying sample data:', error.message);
    return false;
  }

  if (data && data.length > 0) {
    console.log('\nSample data (50 FR, 10U Girls, SCY):');
    data.forEach(record => {
      console.log(`  ${record.time_standard}: ${record.time_seconds}s`);
    });
  }

  return true;
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Vihaan Swim Tracker Database Setup ===\n');

  // Parse CSV data
  const csvPath = path.join(__dirname, '..', 'usa_swimming_standards_cleaned_all.csv');
  console.log('Parsing CSV file...');

  if (!fs.existsSync(csvPath)) {
    console.error(`✗ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const records = parseCSV(csvPath);
  console.log(`✓ Parsed ${records.length} time standard records`);

  // Check if table exists
  console.log('\nChecking if time_standards table exists...');
  const exists = await tableExists();

  if (exists) {
    console.log('⚠ Table already exists. Checking current data...');

    const { count } = await supabase
      .from('time_standards')
      .select('*', { count: 'exact', head: true });

    if (count > 0) {
      console.log(`\nTable already contains ${count} records.`);
      console.log('\nOptions:');
      console.log('  1. Keep existing data and skip loading');
      console.log('  2. Delete existing data and reload');
      console.log('\nPlease use the Supabase Dashboard to drop the table if you want to reload:');
      console.log('  https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/editor');
      console.log('\nOr proceed with verification only...\n');

      const dataVerified = await verifyData();
      if (dataVerified) {
        console.log('\n✓ Database is already set up and working correctly!');
      }
      return;
    }
  } else {
    console.log('✗ Table does not exist. Please create it first using the Supabase Dashboard.');
    console.log('\nYou need to run this SQL in the Supabase SQL Editor:');
    console.log('  https://supabase.com/dashboard/project/gwqwpicbtkamojwwlmlp/sql');
    console.log('\n' + '='.repeat(70));
    console.log(`
CREATE TABLE time_standards (
  id SERIAL PRIMARY KEY,
  event VARCHAR(50) NOT NULL,
  age_group VARCHAR(10) NOT NULL,
  gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
  course VARCHAR(3) NOT NULL CHECK (course IN ('SCY', 'SCM', 'LCM')),
  time_standard VARCHAR(5) NOT NULL,
  time_seconds DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(event, age_group, gender, course, time_standard)
);

CREATE INDEX idx_time_standards_lookup ON time_standards(event, age_group, gender, course);
CREATE INDEX idx_time_standards_event ON time_standards(event);
CREATE INDEX idx_time_standards_age ON time_standards(age_group);

COMMENT ON TABLE time_standards IS 'USA Swimming motivational time standards';
`);
    console.log('='.repeat(70));
    console.log('\nAfter creating the table, run this script again to load the data.');
    process.exit(1);
  }

  // Load data
  const dataLoaded = await loadData(records);
  if (!dataLoaded) {
    console.error('\n✗ Database setup failed at data loading');
    process.exit(1);
  }

  // Verify data
  const dataVerified = await verifyData();
  if (!dataVerified) {
    console.error('\n✗ Database setup failed at verification');
    process.exit(1);
  }

  console.log('\n=== Database setup completed successfully! ===');
}

main().catch(error => {
  console.error('\nUnexpected error:', error);
  process.exit(1);
});
