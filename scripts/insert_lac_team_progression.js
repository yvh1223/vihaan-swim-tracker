const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create client with SERVICE ROLE key to bypass RLS
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

async function main() {
  console.log('🏊‍♂️ Insert LAC Team Progression for 6 Swimmers\n');

  // Step 1: Get date ranges for each swimmer
  console.log('📅 Getting date ranges from competition results...\n');
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
        start_date: dates[0],
        end_date: dates[dates.length - 1],
        count: dates.length
      };
      console.log(`✅ ${swimmerNames[swimmerId]}: ${dates[0]} to ${dates[dates.length - 1]} (${dates.length} records)`);
    }
  }

  // Step 2: Insert team progression records
  console.log('\n💾 Inserting team progression records...\n');
  const records = [];

  for (const swimmerId of swimmerIds) {
    if (dateRanges[swimmerId]) {
      records.push({
        swimmer_id: swimmerId,
        team_name: 'LAC - Gold I Swim Team',
        start_date: dateRanges[swimmerId].start_date,
        end_date: null
      });
    }
  }

  const { data, error } = await supabase
    .from('team_progression')
    .insert(records)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data.length} records:\n`);
  console.table(data.map(r => ({
    id: r.id,
    swimmer_id: r.swimmer_id,
    name: swimmerNames[r.swimmer_id],
    team_name: r.team_name,
    start_date: r.start_date
  })));

  // Step 3: Verify
  console.log('\n🔍 Verifying update...\n');
  const { data: verifyData, error: verifyError } = await supabase
    .from('swimmers')
    .select('id, full_name, current_team')
    .in('id', swimmerIds)
    .order('id');

  if (verifyError) {
    console.error('❌ Verify error:', verifyError.message);
  } else {
    console.table(verifyData);

    const allCorrect = verifyData.every(s => s.current_team === 'LAC - Gold I Swim Team');
    if (allCorrect) {
      console.log('\n🎉 All swimmers now show "LAC - Gold I Swim Team"!');
    } else {
      console.log('\n⚠️  Some swimmers still need updates');
    }
  }
}

main().catch(console.error);
