import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mainCategoryId = 'c1000000-0000-0000-0000-000000000003'; // Mobile & Tech products
const smartWatchesSubcategoryId = 'c1000000-0000-0000-0000-000000000199'; // Smart Watches

const subSubcategories = [
  { id: 'c1000000-0000-0000-0000-000000000251', name: 'Smart Watches', slug: 'smart-watches-devices', icon: 'Watch' },
  { id: 'c1000000-0000-0000-0000-000000000252', name: 'Fitness Bands', slug: 'fitness-bands', icon: 'Activity' },
  { id: 'c1000000-0000-0000-0000-000000000253', name: 'Smart Watch Accessories', slug: 'smart-watch-accessories', icon: 'Watch' },
  { id: 'c1000000-0000-0000-0000-000000000254', name: 'Other Wearables', slug: 'other-wearables', icon: 'Tv' }
];

async function setup() {
  console.log('Logging in...');
  await supabase.auth.signInWithPassword({
    email: 'classifiedallinon@gmail.com',
    password: 'Abdullah0090@'
  });

  // Check if Smart Watches subcategory already exists
  console.log('Checking for Smart Watches subcategory...');
  const { data: existingSub, error: findErr } = await supabase
    .from('categories')
    .select('id')
    .eq('id', smartWatchesSubcategoryId)
    .maybeSingle();

  if (findErr) {
    console.error('Error finding subcategory:', findErr);
  }

  if (!existingSub) {
    console.log('Inserting Smart Watches subcategory...');
    const { error: insertSubErr } = await supabase
      .from('categories')
      .insert({
        id: smartWatchesSubcategoryId,
        name: 'Smart Watches',
        slug: 'smart-watches',
        parent_id: mainCategoryId,
        icon: 'Watch',
        color: '#3b82f6',
        is_active: true
      });

    if (insertSubErr) {
      console.error('Failed to insert Smart Watches subcategory:', insertSubErr);
      return;
    }
    console.log('Successfully inserted Smart Watches subcategory.');
  } else {
    console.log('Smart Watches subcategory already exists.');
  }

  // Insert sub-subcategories
  for (const sub of subSubcategories) {
    console.log(`Checking if sub-subcategory ${sub.name} exists...`);
    const { data: existingChild } = await supabase
      .from('categories')
      .select('id')
      .eq('id', sub.id)
      .maybeSingle();

    if (!existingChild) {
      console.log(`Inserting sub-subcategory: ${sub.name}...`);
      const { error: insertChildErr } = await supabase
        .from('categories')
        .insert({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          parent_id: smartWatchesSubcategoryId,
          icon: sub.icon,
          color: '#3b82f6',
          is_active: true,
          attributes_schema: [
            { name: 'brand', label: 'Brand', type: 'text', required: true }
          ]
        });

      if (insertChildErr) {
        console.error(`Failed to insert sub-subcategory ${sub.name}:`, insertChildErr);
      } else {
        console.log(`Successfully inserted ${sub.name}.`);
      }
    } else {
      console.log(`Sub-subcategory ${sub.name} already exists.`);
    }
  }

  console.log('Setup finished.');
}

setup();
