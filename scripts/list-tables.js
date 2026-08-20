import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const tables = [
    'listings', 'users', 'categories', 'bookmarks', 'offers', 'conversations',
    'messages', 'reports', 'reviews', 'verifications', 'payments', 'notifications',
    'listing_views', 'views', 'ad_views', 'analytics'
  ];

  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`Table exists: ${t}, count: ${count}`);
    } else {
      console.log(`Table ${t} error: ${error.message}`);
    }
  }
}

run();
