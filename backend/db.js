const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Verify connection on startup
(async () => {
  try {
    const { error } = await supabase.from('expenses').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connected – expenses table ready');
  } catch (err) {
    console.error('❌ Supabase connection check failed:', err.message);
    console.error('   Make sure the "expenses" table exists in your Supabase project.');
  }
})();

module.exports = supabase;
