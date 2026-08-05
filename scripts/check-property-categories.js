import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', 'c1000000-0000-0000-0000-000000000002');
  if (error) {
    console.error(error);
    return;
  }
  console.log('Categories fetched from DB:');
  categories.forEach(cat => {
    console.log(`ID: ${cat.id} | Name: ${cat.name} | Slug: ${cat.slug}`);
  });
}

check();
