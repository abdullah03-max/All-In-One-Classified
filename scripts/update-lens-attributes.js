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

  // Find Camera Lenses category
  const { data: cat, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', 'camera-camera-lenses')
    .single();

  if (error) {
    console.error('Error finding Camera Lenses category:', error);
    return;
  }

  console.log(`Found category: ${cat.name} (${cat.id})`);

  const attributesSchema = [
    { name: 'brand', label: 'Brand', type: 'text', required: true },
    {
      name: 'min_focal_length',
      label: 'Min Focal Length Range',
      type: 'select',
      options: [
        'Up to 10mm',
        '11 to 17mm',
        '18 to 25mm',
        '26 to 49mm',
        '50 to 69mm',
        '70 to 99mm',
        '100 to 169mm',
        '170 to 499mm'
      ],
      required: false
    },
    {
      name: 'max_focal_length',
      label: 'Max Focal Length Range',
      type: 'select',
      options: [
        'Up to 10mm',
        '11 to 17mm',
        '18 to 25mm',
        '26 to 49mm',
        '50 to 69mm',
        '70 to 99mm',
        '100 to 169mm',
        '170 to 499mm',
        '500 to 999mm'
      ],
      required: true
    },
    {
      name: 'max_aperture',
      label: 'Max Aperture Range',
      type: 'select',
      options: [
        'f/0.8 to 1.9',
        'f/2.0 to 2.7',
        'f/2.8 to 3.4',
        'f/3.5 to 5.5',
        'f/5.6 to 7.9',
        'f/8.0 & smaller'
      ],
      required: true
    }
  ];

  console.log('Updating attributes schema for Camera Lenses...');
  const { error: updateErr } = await supabase
    .from('categories')
    .update({ attributes_schema: attributesSchema })
    .eq('id', cat.id);

  if (updateErr) {
    console.error('Failed to update attributes schema:', updateErr);
  } else {
    console.log('Successfully updated Camera Lenses attributes schema!');
  }
}

run();
