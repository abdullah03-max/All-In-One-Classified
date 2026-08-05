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
  console.log('Logging in...');
  await supabase.auth.signInWithPassword({
    email: 'classifiedallinon@gmail.com',
    password: 'Abdullah0090@'
  });

  // Find CCTV Cameras category
  const { data: cat, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .ilike('name', '%cctv%')
    .single();

  if (error) {
    console.error('Error finding CCTV category:', error);
    return;
  }

  console.log(`Found category: ${cat.name} (${cat.slug}) -> ID: ${cat.id}`);

  const attributesSchema = [
    { name: 'brand', label: 'Brand', type: 'text', required: true },
    { name: 'type', label: 'Type', type: 'text', required: true },
    { name: 'wifi', label: 'Wifi', type: 'text', required: false }
  ];

  console.log('Updating attributes schema for CCTV Cameras...');
  const { error: updateErr } = await supabase
    .from('categories')
    .update({ attributes_schema: attributesSchema })
    .eq('id', cat.id);

  if (updateErr) {
    console.error('Failed to update attributes schema:', updateErr);
  } else {
    console.log('Successfully updated CCTV Cameras attributes schema!');
  }
}

run();
