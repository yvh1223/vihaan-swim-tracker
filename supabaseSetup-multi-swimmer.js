require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Helper: Parse event name
 */
function parseEventName(eventName) {
  const parts = eventName.trim().split(' ');
  let distance = '';
  let stroke = '';
  let courseType = '';

  if (parts[0].match(/^\d+$/)) {
    distance = parts[0];
  }

  const strokeMap = {
    'FR': 'Freestyle',
    'BK': 'Backstroke',
    'BR': 'Breaststroke',
    'FL': 'Butterfly',
    'IM': 'IM',
  };

  if (parts[1] && strokeMap[parts[1]]) {
    stroke = strokeMap[parts[1]];
  }

  if (eventName.includes('Relay')) {
    stroke = 'Relay';
  }

  if (eventName.includes('SCY')) courseType = 'SCY';
  else if (eventName.includes('LCM')) courseType = 'LCM';
  else if (eventName.includes('SCM')) courseType = 'SCM';

  return { distance, stroke, courseType };
}

/**
 * Helper: Determine team
 */
function determineTeam(date) {
  const meetDate = new Date(date);

  if (meetDate < new Date('2022-06-01')) return 'CORE';
  if (meetDate < new Date('2023-06-01')) return 'CORE';
  if (meetDate < new Date('2024-06-01')) return 'CA';
  if (meetDate < new Date('2024-08-01')) return 'CORE';
  if (meetDate < new Date('2025-03-21')) return 'YMCA';
  return 'Lakeside Aquatic Club';
}

/**
 * Helper: Convert time to seconds
 */
function timeToSeconds(timeStr) {
  if (!timeStr || timeStr === 'DQ' || timeStr === 'Pending') {
    return null;
  }

  const parts = timeStr.split(':');
  if (parts.length === 2) {
    // MM:SS.SS format
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  } else {
    // SS.SS format
    return parseFloat(timeStr);
  }
}

/**
 * Create or get swimmer
 */
async function getOrCreateSwimmer(firstName, lastName, lsc, club, age) {
  // Try to find existing swimmer
  const { data: existing, error: searchError } = await supabase
    .from('swimmers')
    .select('id')
    .eq('first_name', firstName)
    .eq('last_name', lastName)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create new swimmer
  const { data: newSwimmer, error: createError } = await supabase
    .from('swimmers')
    .insert({
      first_name: firstName,
      last_name: lastName,
      current_age: age,
      lsc: lsc,
      club: club,
      active: true,
    })
    .select('id')
    .single();

  if (createError) {
    console.error('Error creating swimmer:', createError.message);
    return null;
  }

  return newSwimmer.id;
}

/**
 * Import competition results (multi-swimmer)
 */
async function importCompetitionResults(csvPath, swimmerId) {
  console.log('\n📥 Importing competition results...\n');

  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.split('\n').slice(1); // Skip header

  const results = [];
  let imported = 0;
  let skipped = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    const [event, date, time, timeStandard, meet, points, age] = line.split(',');

    if (!event || !date || !time || time === 'DQ' || time === 'Pending') {
      skipped++;
      continue;
    }

    const { distance, stroke, courseType } = parseEventName(event);
    const timeInSeconds = timeToSeconds(time);
    const team = determineTeam(date);
    const lsc = 'NT'; // North Texas LSC

    // Store ONLY factual data
    const result = {
      swimmer_id: swimmerId,
      event_name: event,
      meet_name: meet || null,
      event_date: date,
      time_formatted: time,
      time_seconds: timeInSeconds,
      course_type: courseType || null,
      distance: distance || null,
      stroke: stroke || null,
      time_standard: timeStandard || null,
      points: points ? parseInt(points) : null,
      age: age ? parseInt(age) : null,
      team: team,
      lsc: lsc,
    };

    results.push(result);
  }

  // Bulk insert
  if (results.length > 0) {
    const { data, error } = await supabase
      .from('competition_results')
      .insert(results)
      .select();

    if (error) {
      console.error('❌ Error importing:', error.message);
      return 0;
    }

    imported = data.length;
    console.log(`✅ Imported ${imported} competition results`);
    console.log(`⏭️  Skipped ${skipped} invalid entries`);
  }

  return imported;
}

/**
 * Import team progression (multi-swimmer)
 */
async function importTeamProgression(csvPath, swimmerId) {
  console.log('\n📥 Importing team progression...\n');

  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.split('\n').slice(1);

  const teams = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const [teamName, startDate, endDate] = line.split(',');

    if (!teamName || !startDate) continue;

    let organization = 'CORE';
    if (teamName.includes('YMCA')) organization = 'YMCA';
    else if (teamName.includes('LAC')) organization = 'LAC';
    else if (teamName.includes('CA')) organization = 'CA';

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const durationMonths = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));

    teams.push({
      swimmer_id: swimmerId,
      team_name: teamName,
      organization: organization,
      start_date: startDate,
      end_date: endDate || null,
      duration_months: durationMonths,
    });
  }

  if (teams.length > 0) {
    const { data, error} = await supabase
      .from('team_progression')
      .insert(teams)
      .select();

    if (error) {
      console.error('❌ Error importing teams:', error.message);
      return 0;
    }

    console.log(`✅ Imported ${data.length} team records`);
    return data.length;
  }

  return 0;
}

/**
 * Main setup function
 */
async function setupSupabaseTracker() {
  console.log('\n🏊‍♂️ Multi-Swimmer Tracker - Database Setup\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test connection
    console.log('🔌 Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('time_standards')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('\n❌ Connection failed:', testError.message);
      console.log('\n💡 Make sure you:');
      console.log('1. Created a Supabase project at https://supabase.com');
      console.log('2. Ran supabase-schema-multi-swimmer.sql in your SQL Editor');
      console.log('3. Created .env file with your Supabase credentials\n');
      return;
    }

    console.log('✅ Connected to Supabase!\n');

    // Create swimmer: Vihaan H Huchchannavar
    console.log('👤 Creating swimmer profile...');
    const swimmerId = await getOrCreateSwimmer(
      'Vihaan',
      'H Huchchannavar',
      'NT', // North Texas LSC
      'Lakeside Aquatic Club',
      10
    );

    if (!swimmerId) {
      console.error('❌ Failed to create swimmer profile');
      return;
    }

    console.log(`✅ Swimmer profile created (ID: ${swimmerId})\n`);

    // Import data
    const eventTimesPath = path.join(__dirname, 'data/event_times.csv');
    const teamProgressionPath = path.join(__dirname, 'data/team_progression.csv');

    let totalImported = 0;

    if (fs.existsSync(eventTimesPath)) {
      const count = await importCompetitionResults(eventTimesPath, swimmerId);
      totalImported += count;
    } else {
      console.log('⚠️  Competition data file not found at:', eventTimesPath);
    }

    if (fs.existsSync(teamProgressionPath)) {
      const count = await importTeamProgression(teamProgressionPath, swimmerId);
      totalImported += count;
    } else {
      console.log('⚠️  Team progression file not found at:', teamProgressionPath);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`🎉 Setup complete! Imported ${totalImported} total records\n`);

    // Show sample queries with calculated data
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📈 Sample Data (calculated on-the-fly):\n');

    // Progress report with calculated standards
    const { data: progress } = await supabase
      .from('progress_report')
      .select('*')
      .eq('swimmer_id', swimmerId)
      .order('event_name')
      .limit(5);

    if (progress && progress.length > 0) {
      console.log('Progress Report (first 5 events):');
      progress.forEach(r => {
        const nextInfo = r.next_standard
          ? `→ Next: ${r.next_standard} (${r.next_target_time}, gap: ${r.gap_seconds}s)`
          : '→ At top level!';
        console.log(`  ${r.event_name}: ${r.current_time} (${r.current_standard}) ${nextInfo}`);
      });
    }

    // Personal bests
    const { data: pbs } = await supabase
      .from('personal_bests')
      .select('*')
      .eq('swimmer_id', swimmerId)
      .limit(5);

    if (pbs && pbs.length > 0) {
      console.log('\nPersonal Bests (first 5):');
      pbs.forEach(r => {
        console.log(`  ${r.event_name}: ${r.best_time_formatted} (${r.achieved_date})`);
      });
    }

    // Swimmer info
    const { data: swimmerInfo } = await supabase
      .from('swimmers')
      .select('*')
      .eq('id', swimmerId)
      .single();

    if (swimmerInfo) {
      console.log(`\n👤 Swimmer: ${swimmerInfo.full_name}`);
      console.log(`   Age: ${swimmerInfo.current_age}`);
      console.log(`   LSC: ${swimmerInfo.lsc}`);
      console.log(`   Club: ${swimmerInfo.club}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✨ Multi-Swimmer Benefits:');
    console.log('   ✅ Track multiple swimmers in one database');
    console.log('   ✅ Each swimmer has isolated data');
    console.log('   ✅ Easy to add parents, siblings, teammates');
    console.log('   ✅ Query by swimmer_id for individual reports\n');

    console.log('📊 Access your data:');
    console.log(`   Dashboard: ${process.env.SUPABASE_URL.replace('https://', 'https://app.supabase.com/project/')}`);
    console.log('   Table Editor: Click "Table Editor" in sidebar');
    console.log('   SQL Editor: Click "SQL Editor" in sidebar\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  setupSupabaseTracker();
}

module.exports = {
  getOrCreateSwimmer,
  importCompetitionResults,
  importTeamProgression,
  supabase,
};
