import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const newSubSubcategories = [
  'Chargers',
  'Charging Cables',
  'Covers & Cases',
  'Screen Protectors',
  'Mobile Stands',
  'Headphones',
  'Earphones',
  'Converters',
  'Ring Lights',
  'Selfie Sticks',
  'Power Banks',
  'External Memory',
  'Keyboards',
  'Smartphone Lenses',
  'Stylus Pens',
  'App-Enabled Gadgets',
  'Other Accessories',
  'Screens',
  'Smart Watch Accessories'
];

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

  // Find subcategory named 'Accessories' with slug 'electronics-accessories'
  const { data: cat, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', 'electronics-accessories')
    .single();

  if (error) {
    console.error('Error finding Accessories subcategory:', error);
    return;
  }

  console.log(`Found subcategory: ${cat.name} (${cat.id})`);

  // Insert new sub-subcategories
  for (const name of newSubSubcategories) {
    const slug = 'acc-' + name.toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-');

    console.log(`Checking/Inserting sub-subcategory: ${name} (${slug})...`);
    
    // Check if it already exists to avoid duplicates
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      console.log(`  Already exists, skipping.`);
      continue;
    }

    const { error: insertErr } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        parent_id: cat.id,
        icon: 'Headphones',
        color: '#3b82f6',
        is_active: true,
        attributes_schema: [
          { name: 'brand', label: 'Brand', type: 'text', required: true }
        ]
      });

    if (insertErr) {
      console.error(`Failed to insert ${name}:`, insertErr);
    } else {
      console.log(`Successfully inserted ${name}`);
    }
  }
  console.log('Done!');
}

setup();
