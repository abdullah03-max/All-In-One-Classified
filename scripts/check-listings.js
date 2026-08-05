import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'classifiedallinon@gmail.com',
    password: 'Abdullah0090@'
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }
  console.log('Login successful.');

  console.log('Starting migration...');

  // 1. Johar town flat
  const { data: d1, error: e1 } = await supabase
    .from('listings')
    .update({ subcategory_id: '9ef60e0a-9e89-4a78-86ef-5c9ea8b923dd' })
    .eq('id', 'fff7802f-5945-4494-bf48-d9692e3dfa3d')
    .select();
  if (e1) console.error('Error updating Johar town flat:', e1);
  else console.log('Updated Johar town flat:', d1);

  // 2. Residential plot
  const { data: d2, error: e2 } = await supabase
    .from('listings')
    .update({ subcategory_id: '4c4a2d5d-7303-4b97-8e1e-775337fe894e' })
    .eq('id', '864e3690-43e1-476f-932a-b1a82d98ebf7')
    .select();
  if (e2) console.error('Error updating Residential plot:', e2);
  else console.log('Updated Residential plot:', d2);

  // 3. 4 Marala house
  const { data: d3, error: e3 } = await supabase
    .from('listings')
    .update({ subcategory_id: '24e59436-fa5b-4fe6-898c-4ce34c4b901f' })
    .eq('id', '123e1798-4b63-4d74-95d7-146d6eba124b')
    .select();
  if (e3) console.error('Error updating 4 Marala house:', e3);
  else console.log('Updated 4 Marala house:', d3);

  console.log('Migration finished.');
}

run();
