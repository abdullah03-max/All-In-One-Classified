import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: listings } = await supabase.from('listings').select('id, views_count').limit(1);
  if (!listings || listings.length === 0) return;
  const listingId = listings[0].id;
  console.log('Testing on listing:', listings[0]);

  const rpc1 = await supabase.rpc('increment_view_count', { listing_id: listingId });
  console.log('increment_view_count result:', rpc1);

  const rpc2 = await supabase.rpc('increment_listing_views', { listing_id: listingId });
  console.log('increment_listing_views result:', rpc2);
}

run();
