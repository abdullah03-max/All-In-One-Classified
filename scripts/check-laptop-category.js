import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCategory() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', 'c1000000-0000-0000-0000-000000000114');

  if (error) {
    console.error(error);
    return;
  }
  console.log('Category Laptops details:', data);
}

checkCategory();
