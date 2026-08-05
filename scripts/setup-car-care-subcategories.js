import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setup() {
  console.log('Logging in...');
  try {
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: 'classifiedallinon@gmail.com',
      password: 'Abdullah0090@'
    });
    if (loginError) {
      console.error('Login error:', loginError);
      return;
    }
  } catch (err) {
    console.error('Sign in failed:', err);
    return;
  }

  const parentId = 'c1000000-0000-0000-0000-000000000182'; // Car Care
  console.log(`Parent subcategory: Car Care (${parentId})`);

  const subSubCategories = [
    { id: 'c1000000-0000-0000-0000-000000000251', name: 'Pressure Washers', slug: 'pressure-washers' },
    { id: 'c1000000-0000-0000-0000-000000000252', name: 'Waxes', slug: 'waxes' },
    { id: 'c1000000-0000-0000-0000-000000000253', name: 'Covers', slug: 'covers' },
    { id: 'c1000000-0000-0000-0000-000000000254', name: 'Polishes', slug: 'polishes' },
    { id: 'c1000000-0000-0000-0000-000000000255', name: 'Microfiber Cloths', slug: 'microfiber-cloths' },
    { id: 'c1000000-0000-0000-0000-000000000256', name: 'Cleaners', slug: 'cleaners' },
    { id: 'c1000000-0000-0000-0000-000000000257', name: 'Compound Polishes', slug: 'compound-polishes' },
    { id: 'c1000000-0000-0000-0000-000000000258', name: 'Shampoos', slug: 'shampoos' },
    { id: 'c1000000-0000-0000-0000-000000000259', name: 'Air Fresheners', slug: 'air-fresheners' },
    { id: 'c1000000-0000-0000-0000-000000000260', name: 'Pads, Sponges & Brushes', slug: 'pads-sponges-brushes' },
    { id: 'c1000000-0000-0000-0000-000000000261', name: 'Other', slug: 'car-care-other' }
  ];

  for (const n of subSubCategories) {
    console.log(`Checking/Inserting sub-subcategory: ${n.name}...`);
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('id', n.id)
      .maybeSingle();

    if (existing) {
      console.log(`  Already exists. Updating properties...`);
      const { error: upErr } = await supabase
        .from('categories')
        .update({ name: n.name, slug: n.slug, parent_id: parentId })
        .eq('id', n.id);
      if (upErr) console.error(`  Failed to update properties:`, upErr);
      continue;
    }

    const { error: insErr } = await supabase
      .from('categories')
      .insert({
        id: n.id,
        name: n.name,
        slug: n.slug,
        parent_id: parentId,
        icon: 'Wrench',
        color: '#ef4444',
        is_active: true
      });

    if (insErr) {
      console.error(`  Failed to insert category ${n.name}:`, insErr);
    } else {
      console.log(`  Successfully inserted category ${n.name}`);
    }
  }

  console.log('Done database modifications!');
}

setup();
