#!/usr/bin/env node

/**
 * Load USA Swimming Time Standards from CSV into Supabase
 * This script reads the CSV file and inserts all time standards into the database.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Supabase configuration
const SUPABASE_URL = 'https://gwqwpicbtkamojwwlmlp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXdwaWNidGthbW9qd3dsbWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODk3MzAsImV4cCI6MjA3NTg2NTczMH0.5KiCESGV2zzSmhpwDmJ3TsCwdqyCQXntgTGhWkuV27s';

/**
 * Convert swimming time format (MM:SS.SS or SS.SS) to decimal seconds
 * @param {string} timeStr - Time in format MM:SS.SS or SS.SS
 * @returns {number|null} Time in decimal seconds or null if invalid
 */
function convertTimeToSeconds(timeStr) {
    if (!timeStr || timeStr.trim() === '') return null;

    const trimmed = timeStr.trim();

    // Handle MM:SS.SS format (with minutes)
    if (trimmed.includes(':')) {
        const parts = trimmed.split(':');
        if (parts.length !== 2) return null;

        const minutes = parseInt(parts[0], 10);
        const seconds = parseFloat(parts[1]);

        if (isNaN(minutes) || isNaN(seconds)) return null;

        return minutes * 60 + seconds;
    }

    // Handle SS.SS format (seconds only)
    const seconds = parseFloat(trimmed);
    return isNaN(seconds) ? null : seconds;
}

/**
 * Parse CSV row into time standard object
 * @param {string} line - CSV line
 * @returns {object|null} Parsed time standard or null if invalid
 */
function parseCSVRow(line) {
    // Split by comma, handling quoted fields if needed
    const fields = line.split(',');

    if (fields.length < 11) {
        console.warn('Invalid row (insufficient fields):', line);
        return null;
    }

    const ageGroup = fields[0]?.trim();
    const course = fields[1]?.trim();
    const gender = fields[2]?.trim();
    const event = fields[3]?.trim();
    const ageGroupCode = fields[10]?.trim();

    // Validate required fields
    if (!ageGroup || !course || !gender || !event || !ageGroupCode) {
        console.warn('Invalid row (missing required fields):', line);
        return null;
    }

    // Convert all time standards to seconds
    const bStandard = convertTimeToSeconds(fields[4]);
    const bbStandard = convertTimeToSeconds(fields[5]);
    const aStandard = convertTimeToSeconds(fields[6]);
    const aaStandard = convertTimeToSeconds(fields[7]);
    const aaaStandard = convertTimeToSeconds(fields[8]);
    const aaaaStandard = convertTimeToSeconds(fields[9]);

    return {
        age_group: ageGroup,
        age_group_code: ageGroupCode,
        course_type: course,
        gender: gender,
        event_name: event,
        b_standard: bStandard,
        bb_standard: bbStandard,
        a_standard: aStandard,
        aa_standard: aaStandard,
        aaa_standard: aaaStandard,
        aaaa_standard: aaaaStandard
    };
}

/**
 * Insert time standards into Supabase in batches
 * @param {Array} standards - Array of time standard objects
 */
async function insertTimeStandards(standards) {
    console.log(`\nInserting ${standards.length} time standards into Supabase...`);

    const BATCH_SIZE = 100;
    let successCount = 0;
    let errorCount = 0;

    // Process in batches for better performance
    for (let i = 0; i < standards.length; i += BATCH_SIZE) {
        const batch = standards.slice(i, i + BATCH_SIZE);

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/time_standards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(batch)
            });

            if (response.ok) {
                successCount += batch.length;
                console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Inserted ${batch.length} records (${successCount}/${standards.length})`);
            } else {
                const errorText = await response.text();
                console.error(`  ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, errorText);
                errorCount += batch.length;
            }
        } catch (error) {
            console.error(`  ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
            errorCount += batch.length;
        }

        // Small delay between batches to avoid rate limiting
        if (i + BATCH_SIZE < standards.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    console.log(`\n=== Results ===`);
    console.log(`✓ Successfully inserted: ${successCount}`);
    console.log(`✗ Failed: ${errorCount}`);
    console.log(`Total: ${standards.length}`);

    return { successCount, errorCount };
}

/**
 * Main function to load time standards from CSV
 */
async function main() {
    const csvPath = path.join(__dirname, '..', 'usa_swimming_standards_cleaned_all.csv');

    console.log('=== USA Swimming Time Standards Loader ===');
    console.log(`Reading CSV: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
        console.error(`Error: CSV file not found at ${csvPath}`);
        process.exit(1);
    }

    const fileStream = fs.createReadStream(csvPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const standards = [];
    let lineNumber = 0;
    let headerSkipped = false;

    // Read and parse CSV
    for await (const line of rl) {
        lineNumber++;

        // Skip header row
        if (!headerSkipped) {
            headerSkipped = true;
            console.log('Header row skipped');
            continue;
        }

        // Skip empty lines
        if (!line.trim()) continue;

        const standard = parseCSVRow(line);
        if (standard) {
            standards.push(standard);
        }
    }

    console.log(`\nParsed ${standards.length} time standards from ${lineNumber} lines`);

    if (standards.length === 0) {
        console.error('No valid standards found in CSV');
        process.exit(1);
    }

    // Display summary
    const ageGroups = [...new Set(standards.map(s => s.age_group))];
    const courseTypes = [...new Set(standards.map(s => s.course_type))];
    const genders = [...new Set(standards.map(s => s.gender))];
    const events = [...new Set(standards.map(s => s.event_name))];

    console.log('\n=== Data Summary ===');
    console.log(`Age Groups (${ageGroups.length}):`, ageGroups.join(', '));
    console.log(`Course Types (${courseTypes.length}):`, courseTypes.join(', '));
    console.log(`Genders (${genders.length}):`, genders.join(', '));
    console.log(`Unique Events (${events.length}):`, events.length);

    // Sample data for verification
    console.log('\n=== Sample Record ===');
    console.log(JSON.stringify(standards[0], null, 2));

    // Insert into Supabase
    const result = await insertTimeStandards(standards);

    if (result.errorCount === 0) {
        console.log('\n✓ All time standards loaded successfully!');
        process.exit(0);
    } else {
        console.error('\n✗ Some errors occurred during loading');
        process.exit(1);
    }
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
