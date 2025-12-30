#!/usr/bin/env node

/**
 * ABOUTME: Split large SQL file into individual swimmer files
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'load_all_swimmers.sql');
const outputDir = path.join(__dirname, 'sql_by_swimmer');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Splitting SQL file by swimmer...\n');

// Read the entire file
const content = fs.readFileSync(inputFile, 'utf8');

// Split by swimmer comments (e.g., "-- Asa Davidson (280 records)")
const sections = content.split(/(?=^-- [A-Z].*\(\d+ records\))/m);

let fileCount = 0;

sections.forEach((section, index) => {
  if (section.trim() === '' || index === 0) return; // Skip header

  // Extract swimmer name from comment line
  const match = section.match(/^-- ([^(]+)\((\d+) records\)/);
  if (!match) return;

  const swimmerName = match[1].trim();
  const recordCount = match[2];
  const fileName = swimmerName.replace(/\s+/g, '_') + '.sql';
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, section);
  console.log(`✓ ${swimmerName}: ${recordCount} records → ${fileName}`);
  fileCount++;
});

console.log('\n' + '═'.repeat(60));
console.log(`✅ Created ${fileCount} SQL files in: sql_by_swimmer/`);
console.log('═'.repeat(60));
console.log('\nTo load data:');
console.log('1. Open Supabase SQL Editor');
console.log('2. Copy/paste each file content (one at a time)');
console.log('3. Execute');
console.log('4. Duplicates will be automatically skipped\n');
