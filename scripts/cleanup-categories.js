import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanup() {
  console.log('Logging in...');
  await supabase.auth.signInWithPassword({
    email: 'classifiedallinon@gmail.com',
    password: 'Abdullah0090@'
  });

  // Find the Computers category ID
  const { data: computersCat, error: compErr } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .ilike('name', '%Computers%');

  if (compErr) {
    console.error('Error finding Computers category:', compErr);
    return;
  }

  console.log('Found computers categories:', computersCat);

  // We want to delete "Speakers" and "Mike" / "Microphone" / "Microphones" under parent "Computers"
  for (const comp of computersCat || []) {
    const parentId = comp.id;
    console.log(`Checking subcategories under parent ${comp.name} (${parentId})...`);

    const { data: subs, error: subErr } = await supabase
      .from('categories')
      .select('id, name')
      .eq('parent_id', parentId);

    if (subErr) {
      console.error('Error finding subcategories:', subErr);
      continue;
    }

    console.log('Subcategories found:', subs);

    const toDelete = subs.filter(s => {
      const name = s.name.toLowerCase();
      return name === 'speakers' || name === 'mike' || name === 'microphone' || name === 'microphones';
    });

    console.log('Target subcategories to delete:', toDelete);

    for (const cat of toDelete) {
      console.log(`Deleting category: ${cat.name} (${cat.id})...`);
      // Note: we might have listings associated, so we should delete them or update their category first if any exist
      const { error: delErr } = await supabase
        .from('categories')
        .delete()
        .eq('id', cat.id);

      if (delErr) {
        console.error(`Failed to delete category ${cat.name}:`, delErr);
      } else {
        console.log(`Successfully deleted ${cat.name}`);
      }
    }
  }
}

cleanup();
