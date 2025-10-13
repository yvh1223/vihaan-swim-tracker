#!/usr/bin/env node

/**
 * Database Setup Script for Vihaan Swim Tracker
 *
 * This script:
 * 1. Creates the time_standards table in Supabase
 * 2. Loads all time standards from the CSV file
 * 3. Verifies the data was loaded correctly
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
 * Create the time_standards table
 */
async function createTable() {
  console.log('Creating time_standards table...');

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      -- Drop existing table if it exists
      DROP TABLE IF EXISTS time_standards CASCADE;

      -- Create time_standards table
      CREATE TABLE time_standards (
        id SERIAL PRIMARY KEY,
        event VARCHAR(50) NOT NULL,
        age_group VARCHAR(10) NOT NULL,
        gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
        course VARCHAR(3) NOT NULL CHECK (course IN ('SCY', 'SCM', 'LCM')),
        time_standard VARCHAR(5) NOT NULL,
        time_seconds DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Create composite unique constraint
        UNIQUE(event, age_group, gender, course, time_standard)
      );

      -- Create indexes for common query patterns
      CREATE INDEX idx_time_standards_lookup ON time_standards(event, age_group, gender, course);
      CREATE INDEX idx_time_standards_event ON time_standards(event);
      CREATE INDEX idx_time_standards_age ON time_standards(age_group);

      -- Add comment
      COMMENT ON TABLE time_standards IS 'USA Swimming motivational time standards';
    `
  });

  if (error) {
    console.error('Error creating table:', error);
    return false;
  }

  console.log('✓ Table created successfully');
  return true;
}

/**
 * Load data in batches
 */
async function loadData(records) {
  console.log(`Loading ${records.length} time standard records...`);

  const batchSize = 100;
  let loaded = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const { error } = await supabase
      .from('time_standards')
      .insert(batch);

    if (error) {
      console.error(`Error loading batch ${i / batchSize + 1}:`, error);
      return false;
    }

    loaded += batch.length;
    process.stdout.write(`\r  Loaded ${loaded}/${records.length} records...`);
  }

  console.log('\n✓ All records loaded successfully');
  return true;
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
    console.error('Error counting records:', countError);
    return false;
  }

  console.log(`✓ Total records: ${count}`);

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
    console.error('Error querying sample data:', error);
    return false;
  }

  console.log('\nSample data (50 FR, 10U Girls, SCY):');
  data.forEach(record => {
    console.log(`  ${record.time_standard}: ${record.time_seconds}s`);
  });

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
  const records = parseCSV(csvPath);
  console.log(`✓ Parsed ${records.length} time standard records\n`);

  // Create table
  const tableCreated = await createTable();
  if (!tableCreated) {
    console.error('\n✗ Database setup failed at table creation');
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
