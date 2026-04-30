/**
 * One-time setup script: creates the "expenses" table in Supabase.
 * Run with: node setup-db.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('🔧 Creating expenses table in Supabase...');

  // Use Supabase's rpc to run raw SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS expenses (
        id BIGSERIAL PRIMARY KEY,
        amount INTEGER NOT NULL CHECK (amount > 0),
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        date DATE NOT NULL,
        client_request_id UUID UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  });

  if (error) {
    console.error('❌ Failed via rpc. Error:', error.message);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Please run this SQL manually in your Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/xmhdhiervhcdcidprabn/sql');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  client_request_id UUID UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }

  console.log('✅ expenses table created successfully!');
  console.log('🚀 You can now start the backend with: npm run dev');
}

setup();
