require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use environment variables for security
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Load scraped data from JSON file
const dataPath = path.join(__dirname, 'swara_scraped_data.json');
const scrapedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const SWARA_ID = scrapedData.swimmer_id;
const allResults = scrapedData.results;

// Helper functions
function convertTimeToSeconds(timeStr) {
    if (!timeStr) return null;
    // Remove 'r' suffix if present (relay indicator)
    timeStr = timeStr.replace('r', '').trim();

    if (timeStr.includes(':')) {
        const [minutes, seconds] = timeStr.split(':');
        return parseFloat(minutes) * 60 + parseFloat(seconds);
    }
    return parseFloat(timeStr);
}

function parseSwimDate(dateString) {
    // USA Swimming format: "MM/DD/YYYY"
    // Convert to ISO: "YYYY-MM-DD"
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function extractEventParts(eventName) {
    // Extract distance, stroke, and course from event name
    // Example: "100 FR SCY" -> distance: "100", stroke: "FR", course: "SCY"
    const parts = eventName.split(' ');
    return {
        distance: parts[0],
        stroke: parts[1],
        course_type: parts[2] || 'SCY'
    };
}

function normalizeTimeStandard(standard) {
    // Clean up time standard values
    if (!standard) return null;
    if (standard === 'Slower than B' || standard.includes('Slower')) return null;
    if (standard === 'N/A') return null;
    if (standard.includes('2020-2024')) {
        // Remove year prefix
        return standard.replace(/2020-2024\s+/, '');
    }
    return standard;
}

async function importResults() {
    console.log(`\n📊 Swara Chitre - Data Import`);
    console.log(`Swimmer: ${scrapedData.swimmer_name}`);
    console.log(`Age: ${scrapedData.age} | Gender: ${scrapedData.gender}`);
    console.log(`Team: ${scrapedData.team} | LSC: ${scrapedData.lsc}`);
    console.log(`Scraped: ${scrapedData.scrape_date}`);
    console.log('='.repeat(60));
    console.log(`Starting import of ${allResults.length} results for Swara Chitre (ID: ${SWARA_ID})...`);

    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const result of allResults) {
        try {
            const timeSeconds = convertTimeToSeconds(result.swim_time);
            const eventParts = extractEventParts(result.event);
            const eventDate = parseSwimDate(result.swim_date);
            const timeStandard = normalizeTimeStandard(result.time_standard);

            const record = {
                swimmer_id: SWARA_ID,
                event_name: result.event,
                meet_name: result.meet,
                event_date: eventDate,
                time_formatted: result.swim_time.replace('r', ''), // Remove relay indicator
                time_seconds: timeSeconds,
                course_type: eventParts.course_type,
                distance: eventParts.distance,
                stroke: eventParts.stroke,
                time_standard: timeStandard,
                points: result.points ? parseInt(result.points) : null,
                lsc: result.lsc,
                team: result.team,
                age: parseInt(result.age)
            };

            // Check if record already exists
            const { data: existing, error: checkError } = await supabase
                .from('competition_results')
                .select('id')
                .eq('swimmer_id', SWARA_ID)
                .eq('event_name', result.event)
                .eq('event_date', eventDate)
                .eq('meet_name', result.meet)
                .maybeSingle();

            if (existing) {
                skipped++;
                console.log(`⏭️  Skipped (duplicate): ${result.event} on ${eventDate}`);
                continue;
            }

            // Insert new record
            const { error: insertError } = await supabase
                .from('competition_results')
                .insert([record]);

            if (insertError) {
                throw insertError;
            }

            inserted++;
            console.log(`✅ Inserted: ${result.event} - ${result.swim_time} (${result.time_standard}) on ${eventDate}`);

        } catch (err) {
            errors++;
            console.error(`❌ Error inserting ${result.event}: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Import Summary:');
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total: ${allResults.length}`);
    console.log('='.repeat(60));
}

// Run import
importResults().then(() => {
    console.log('\n✨ Import complete!');
    process.exit(0);
}).catch(err => {
    console.error('\n💥 Import failed:', err);
    process.exit(1);
});
