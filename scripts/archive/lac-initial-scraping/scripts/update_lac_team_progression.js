#!/usr/bin/env node

/**
 * Update Team Progression for LAC Swimmers
 * Adds "LAC - Gold I Swim Team" team progression records for swimmers 21-26
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

// Create Supabase client with SERVICE ROLE key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const swimmerIds = [21, 22, 23, 24, 25, 26];
const swimmerNames = {
  21: 'Parker Li',
  22: 'Scarlett Mann',
  23: 'Kiaan Patel',
  24: 'Brooke Long',
  25: 'Jason Ma',
  26: 'William Power'
};

async function checkCurrentTeamProgression() {
  console.log('\n📋 Step 1: Checking current team progression...\n');

  const { data, error } = await supabase
    .from('team_progression')
    .select('*')
    .in('swimmer_id', swimmerIds)
    .order('swimmer_id')
    .order('start_date');

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  console.log(`✅ Found ${data.length} existing team progression records:`);
  if (data.length > 0) {
    console.table(data.map(r => ({
      id: r.id,
      swimmer_id: r.swimmer_id,
      team_name: r.team_name,
      start_date: r.start_date,
      end_date: r.end_date
    })));
  } else {
    console.log('   No existing records found.');
  }

  return data;
}

async function getDateRanges() {
  console.log('\n📅 Step 2: Getting date ranges from competition results...\n');

  const dateRanges = {};

  for (const swimmerId of swimmerIds) {
    const { data, error } = await supabase
      .from('competition_results')
      .select('event_date')
      .eq('swimmer_id', swimmerId)
      .order('event_date');

    if (error) {
      console.error(`❌ Error for swimmer ${swimmerId}:`, error.message);
      continue;
    }

    if (data && data.length > 0) {
      const dates = data.map(r => r.event_date);
      dateRanges[swimmerId] = {
        name: swimmerNames[swimmerId],
        start_date: dates[0],
        end_date: dates[dates.length - 1],
        record_count: dates.length
      };
      console.log(`✅ ${swimmerNames[swimmerId]} (ID ${swimmerId}): ${dates[0]} to ${dates[dates.length - 1]} (${dates.length} records)`);
    } else {
      console.log(`⚠️  ${swimmerNames[swimmerId]} (ID ${swimmerId}): No competition results found`);
    }
  }

  return dateRanges;
}

async function insertTeamProgressionRecords(dateRanges) {
  console.log('\n💾 Step 3: Inserting team progression records...\n');

  if (Object.keys(dateRanges).length === 0) {
    console.error('❌ Error: No date ranges available. Run Step 2 first!');
    return null;
  }

  const records = [];
  for (const swimmerId of swimmerIds) {
    if (dateRanges[swimmerId]) {
      records.push({
        swimmer_id: swimmerId,
        team_name: 'LAC - Gold I Swim Team',
        start_date: dateRanges[swimmerId].start_date,
        end_date: null // Current team (no end date)
      });
    }
  }

  console.log(`📝 Attempting to insert ${records.length} records...`);

  const { data, error } = await supabase
    .from('team_progression')
    .insert(records)
    .select();

  if (error) {
    console.error('❌ Error inserting records:', error.message);
    console.error('   Details:', error);
    return null;
  }

  console.log(`✅ Successfully inserted ${data.length} team progression records:`);
  console.table(data.map(r => ({
    id: r.id,
    swimmer_id: r.swimmer_id,
    name: swimmerNames[r.swimmer_id],
    team_name: r.team_name,
    start_date: r.start_date,
    end_date: r.end_date
  })));

  return data;
}

async function verifyUpdate() {
  console.log('\n🔍 Step 4: Verifying update...\n');

  // Check team_progression
  const { data: teamData, error: teamError } = await supabase
    .from('team_progression')
    .select('swimmer_id, team_name, start_date, end_date')
    .in('swimmer_id', swimmerIds)
    .order('swimmer_id');

  if (teamError) {
    console.error('❌ Error checking team_progression:', teamError.message);
    return;
  }

  console.log('✅ Team Progression Records:');
  console.table(teamData.map(r => ({
    swimmer_id: r.swimmer_id,
    name: swimmerNames[r.swimmer_id],
    team_name: r.team_name,
    start_date: r.start_date,
    end_date: r.end_date || '(current)'
  })));

  // Check swimmers current_team
  const { data: swimmerData, error: swimmerError } = await supabase
    .from('swimmers')
    .select('id, full_name, current_team')
    .in('id', swimmerIds)
    .order('id');

  if (swimmerError) {
    console.error('❌ Error checking swimmers:', swimmerError.message);
    return;
  }

  console.log('\n✅ Swimmers Current Team:');
  console.table(swimmerData);

  // Verify all swimmers have LAC - Gold I Swim Team
  const missingTeam = swimmerData.filter(s => s.current_team !== 'LAC - Gold I Swim Team');
  if (missingTeam.length > 0) {
    console.log('\n⚠️  Warning: Some swimmers do not have "LAC - Gold I Swim Team" as current_team:');
    console.table(missingTeam);
  } else {
    console.log('\n🎉 All swimmers have "LAC - Gold I Swim Team" as their current team!');
  }
}

async function main() {
  console.log('🏊‍♂️ Update LAC Team Progression for 6 Swimmers');
  console.log('==================================================\n');
  console.log('Swimmers:');
  for (const [id, name] of Object.entries(swimmerNames)) {
    console.log(`  - ${name} (ID ${id})`);
  }

  try {
    // Step 1: Check current state
    const currentRecords = await checkCurrentTeamProgression();

    // Step 2: Get date ranges
    const dateRanges = await getDateRanges();

    // Step 3: Insert team progression records
    const insertedRecords = await insertTeamProgressionRecords(dateRanges);

    if (insertedRecords) {
      // Step 4: Verify update
      await verifyUpdate();

      console.log('\n✅ Update completed successfully!');
    } else {
      console.log('\n❌ Update failed. Check errors above.');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
