import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const subSubcategories = [
  'Digital Cameras',
  'Camera Lenses',
  'Flash Guns',
  'Bags & Cases',
  'Video Cameras',
  'Tripods & Stands',
  'Camera Batteries',
  'CCTV Cameras',
  'Professional Microphones',
  'Video Lights',
  'Gimbles & Stablizers',
  'Drones',
  'Binoculars',
  'Other Cameras Accessories',
  'Camera & Lenses Accessories',
  'Binoculars & Optics Accessories'
];

async function setup() {
  console.log('Logging in...');
  await supabase.auth.signInWithPassword({
    email: 'classifiedallinon@gmail.com',
    password: 'Abdullah0090@'
  });

  // Find subcategory named 'Cameras'
  const { data: cat, error } = await supabase
    .from('categories')
    .select('id, name')
    .ilike('name', 'Cameras')
    .single();

  if (error) {
    console.error('Error finding Cameras subcategory:', error);
    return;
  }

  console.log(`Found subcategory: ${cat.name} (${cat.id})`);

  // Rename to "Camera & Accessories"
  console.log('Renaming subcategory to "Camera & Accessories"...');
  const { error: renameErr } = await supabase
    .from('categories')
    .update({ name: 'Camera & Accessories', slug: 'mobile-camera-accessories' })
    .eq('id', cat.id);

  if (renameErr) {
    console.error('Failed to rename subcategory:', renameErr);
    return;
  }
  console.log('Successfully renamed subcategory.');

  // Clean existing child categories (if any)
  console.log('Cleaning existing sub-subcategories under this category...');
  const { error: deleteErr } = await supabase
    .from('categories')
    .delete()
    .eq('parent_id', cat.id);

  if (deleteErr) {
    console.error('Warning: error during delete:', deleteErr);
  }

  // Insert new sub-subcategories
  for (const name of subSubcategories) {
    const slug = 'camera-' + name.toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-');

    console.log(`Inserting sub-subcategory: ${name} (${slug})...`);
    
    const { error: insertErr } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        parent_id: cat.id,
        icon: 'Camera',
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
