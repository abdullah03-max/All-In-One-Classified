import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: users, error: usersError } = await supabase.from('users').select('*').limit(5);
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }
  console.log('Users found:', users.length);
  users.forEach(u => console.log(`- ${u.id}: ${u.full_name} (${u.role})`));

  const { data: categories, error: catError } = await supabase.from('categories').select('*');
  if (catError) {
    console.error('Error fetching categories:', catError);
    return;
  }
  console.log('Categories found:', categories.length);
}

test();
