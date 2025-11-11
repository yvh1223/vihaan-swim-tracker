/**
 * Load Scraped USA Swimming Data to Supabase
 *
 * Loads scraped swimmer timing data into Supabase database
 * Usage: node load_to_supabase.js <scraped-data-file.json>
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse event name to extract distance, stroke, and course
 */
function parseEventName(eventName) {
  // Example: "50 FR SCY" → { distance: 50, stroke: "FR", course: "SCY" }
  // Example: "100 BK LCM" → { distance: 100, stroke: "BK", course: "LCM" }

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

/**
 * Convert time string to seconds
 */
function timeToSeconds(timeStr) {
  // Examples: "35.18", "1:21.72", "2:59.78"

  if (!timeStr || timeStr === '') return null;

  const parts = timeStr.split(':');

  if (parts.length === 1) {
    // Just seconds: "35.18"
    return parseFloat(parts[0]);
  } else if (parts.length === 2) {
    // Minutes and seconds: "1:21.72"
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  return null;
}

/**
 * Parse date from USA Swimming format
 */
function parseDate(dateStr) {
  // Example: "10/04/2025" → "2025-10-04"

  if (!dateStr || dateStr === '') return null;

  try {
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error.message);
    return null;
  }
}

/**
 * Find or create swimmer in database
 */
async function findOrCreateSwimmer(firstName, lastName) {
  console.log(`🔍 Looking up swimmer: ${firstName} ${lastName}`);

  // Try to find existing swimmer
  const { data: existing, error: findError } = await supabase
    .from('swimmers')
    .select('id, first_name, last_name, full_name')
    .ilike('first_name', firstName)
    .ilike('last_name', lastName)
    .limit(1);

  if (findError) {
    console.error('Error finding swimmer:', findError);
    throw findError;
  }

  if (existing && existing.length > 0) {
    console.log(`✅ Found existing swimmer: ${existing[0].full_name} (ID: ${existing[0].id})`);
    return existing[0].id;
  }

  // Create new swimmer
  console.log(`➕ Creating new swimmer: ${firstName} ${lastName}`);

  const { data: newSwimmer, error: createError } = await supabase
    .from('swimmers')
    .insert({
      first_name: firstName,
      last_name: lastName,
      current_age: null // Will need to be updated manually based on results
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating swimmer:', createError);
    throw createError;
  }

  console.log(`✅ Created new swimmer: ${newSwimmer.full_name} (ID: ${newSwimmer.id})`);
  return newSwimmer.id;
}

/**
 * Load competition results for a swimmer
 */
async function loadCompetitionResults(swimmerId, results) {
  console.log(`\n📊 Loading ${results.length} competition results...`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const result of results) {
    try {
      const { distance, stroke, course } = parseEventName(result.event);
      const timeSeconds = timeToSeconds(result.swimTime);
      const eventDate = parseDate(result.swimDate);

      // Check for existing record to avoid duplicates
      const { data: existing } = await supabase
        .from('competition_results')
        .select('id')
        .eq('swimmer_id', swimmerId)
        .eq('event_name', result.event)
        .eq('event_date', eventDate)
        .eq('meet_name', result.meet)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      // Insert new record with correct column names
      const { error } = await supabase
        .from('competition_results')
        .insert({
          swimmer_id: swimmerId,
          event_name: result.event,
          time_seconds: timeSeconds,
          time_formatted: result.swimTime || null,
          course_type: course,
          distance: distance,
          stroke: stroke,
          time_standard: result.timeStandard || null,
          meet_name: result.meet || null,
          event_date: eventDate,
          age: parseInt(result.age) || null,
          points: parseInt(result.points) || null,
          lsc: result.lsc || null,
          team: result.team || null
        });

      if (error) {
        console.error(`❌ Error inserting result for ${result.event}:`, error.message);
        errors++;
      } else {
        inserted++;
      }

    } catch (error) {
      console.error(`❌ Error processing result:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Inserted: ${inserted}`);
  console.log(`⏭️  Skipped (duplicates): ${skipped}`);
  if (errors > 0) {
    console.log(`❌ Errors: ${errors}`);
  }

  return { inserted, skipped, errors };
}

/**
 * Load scraped data file
 */
async function loadScrapedData(filepath) {
  console.log(`\n📂 Loading scraped data from: ${filepath}`);

  try {
    const data = await fs.readFile(filepath, 'utf8');
    const results = JSON.parse(data);

    console.log(`✅ Loaded ${results.length} records`);
    return results;

  } catch (error) {
    console.error(`❌ Error loading file:`, error.message);
    throw error;
  }
}

/**
 * Extract swimmer name from filename or first record
 */
function extractSwimmerInfo(filename, results) {
  // Try to extract from filename first (e.g., "serena_tsao_123456.json")
  const match = filename.match(/^([a-z]+)_([a-z]+)_\d+\.json$/i);

  if (match) {
    return {
      firstName: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(),
      lastName: match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase()
    };
  }

  // Otherwise, prompt user
  console.log('⚠️  Could not extract swimmer name from filename');
  return null;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node load_to_supabase.js <scraped-data-file.json> [firstName] [lastName]');
    console.log('\nExample:');
    console.log('  node load_to_supabase.js scraped_data/serena_tsao_123456.json');
    console.log('  node load_to_supabase.js scraped_data/data.json Serena Tsao');
    process.exit(1);
  }

  const filepath = args[0];
  let firstName = args[1];
  let lastName = args[2];

  console.log('🏊‍♂️ USA Swimming Data Loader for Supabase\n');
  console.log('='.repeat(50));

  // Load scraped data
  const results = await loadScrapedData(filepath);

  // Extract swimmer info
  const filename = require('path').basename(filepath);
  const swimmerInfo = extractSwimmerInfo(filename, results);

  if (!firstName && !lastName && swimmerInfo) {
    firstName = swimmerInfo.firstName;
    lastName = swimmerInfo.lastName;
  }

  if (!firstName || !lastName) {
    console.error('❌ Could not determine swimmer name');
    console.error('Please provide firstName and lastName as arguments');
    process.exit(1);
  }

  console.log(`\n👤 Swimmer: ${firstName} ${lastName}`);
  console.log('='.repeat(50));

  // Find or create swimmer
  const swimmerId = await findOrCreateSwimmer(firstName, lastName);

  // Load competition results
  const { inserted, skipped, errors } = await loadCompetitionResults(swimmerId, results);

  console.log('\n' + '='.repeat(50));
  console.log('📊 LOADING SUMMARY');
  console.log('='.repeat(50));
  console.log(`Swimmer: ${firstName} ${lastName} (ID: ${swimmerId})`);
  console.log(`Total records processed: ${results.length}`);
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(50) + '\n');

  if (errors > 0) {
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { loadScrapedData, findOrCreateSwimmer, loadCompetitionResults };
