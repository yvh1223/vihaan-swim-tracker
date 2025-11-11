require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getColumns() {
  // Get one row to see what columns exist
  const { data, error } = await supabase
    .from('competition_results')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in competition_results table:');
    console.log(Object.keys(data[0]));
  } else {
    console.log('Table is empty');
  }
}

getColumns();
