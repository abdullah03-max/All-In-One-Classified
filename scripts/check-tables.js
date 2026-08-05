import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing category_field_options table query...');
  const { data, error } = await supabase
    .from('category_field_options')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error querying category_field_options:', error);
  } else {
    console.log('Successfully queried category_field_options! Data:', data);
  }
}

run();
