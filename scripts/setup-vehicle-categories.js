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

  // Find parent category 'Vehicles'
  const { data: parentCat, error: parentErr } = await supabase
    .from('categories')
    .select('id, name')
    .eq('slug', 'vehicles')
    .single();

  if (parentErr) {
    console.error('Error finding Vehicles parent category:', parentErr);
    return;
  }

  const parentId = parentCat.id;
  console.log(`Found parent category: ${parentCat.name} (${parentId})`);

  // Target subcategories layout:
  // 1. Cars (c1000000-0000-0000-0000-000000000101) - Keep
  // 2. Cars on Installments (c1000000-0000-0000-0000-000000000181) - New
  // 3. Car Care (c1000000-0000-0000-0000-000000000182) - New
  // 4. Cars Accessories (c1000000-0000-0000-0000-000000000183) - New
  // 5. Spare Parts (c1000000-0000-0000-0000-000000000105 - Rename Auto Parts)
  // 6. Oil & Lubricants (c1000000-0000-0000-0000-000000000184) - New
  // 7. Buses, Vans & Trucks (c1000000-0000-0000-0000-000000000104 - Rename Trucks & Buses)
  // 8. Rickshaw & Chingchi (c1000000-0000-0000-0000-000000000185) - New
  // 9. Tractors & Trailers (c1000000-0000-0000-0000-000000000186) - New
  // 10. Boats (c1000000-0000-0000-0000-000000000187) - New
  // 11. Other Vehicles (c1000000-0000-0000-0000-000000000106 - Rename Heavy Machinery)

  const renames = [
    { id: 'c1000000-0000-0000-0000-000000000105', name: 'Spare Parts', slug: 'spare-parts', icon: 'Settings' },
    { id: 'c1000000-0000-0000-0000-000000000104', name: 'Buses, Vans & Trucks', slug: 'buses-vans-trucks', icon: 'Truck' },
    { id: 'c1000000-0000-0000-0000-000000000106', name: 'Other Vehicles', slug: 'other-vehicles', icon: 'Car' }
  ];

  const news = [
    { id: 'c1000000-0000-0000-0000-000000000181', name: 'Cars on Installments', slug: 'cars-on-installments', icon: 'Clock' },
    { id: 'c1000000-0000-0000-0000-000000000182', name: 'Car Care', slug: 'car-care', icon: 'Wrench' },
    { id: 'c1000000-0000-0000-0000-000000000183', name: 'Cars Accessories', slug: 'cars-accessories', icon: 'Sliders' },
    { id: 'c1000000-0000-0000-0000-000000000184', name: 'Oil & Lubricants', slug: 'oil-lubricants', icon: 'Droplet' },
    { id: 'c1000000-0000-0000-0000-000000000185', name: 'Rickshaw & Chingchi', slug: 'rickshaw-chingchi', icon: 'Car' },
    { id: 'c1000000-0000-0000-0000-000000000186', name: 'Tractors & Trailers', slug: 'tractors-trailers', icon: 'Settings' },
    { id: 'c1000000-0000-0000-0000-000000000187', name: 'Boats', slug: 'boats', icon: 'Ship' }
  ];

  // Map old Motorcycles (102) & Bicycles (103) listings to Other Vehicles (106)
  const otherVehiclesId = 'c1000000-0000-0000-0000-000000000106';
  const oldIdsToMigrate = ['c1000000-0000-0000-0000-000000000102', 'c1000000-0000-0000-0000-000000000103'];

  for (const oldId of oldIdsToMigrate) {
    console.log(`Migrating listings from subcategory ${oldId} to ${otherVehiclesId}...`);
    const { error: updateListingsErr } = await supabase
      .from('listings')
      .update({ subcategory_id: otherVehiclesId })
      .eq('subcategory_id', oldId);

    if (updateListingsErr) {
      console.error(`Failed to migrate listings for subcategory ${oldId}:`, updateListingsErr);
    } else {
      console.log(`Successfully migrated listings for subcategory ${oldId}`);
    }
  }

  // Delete old Motorcycles (102) and Bicycles (103) subcategories
  for (const oldId of oldIdsToMigrate) {
    console.log(`Deleting obsolete subcategory ${oldId}...`);
    const { error: delErr } = await supabase
      .from('categories')
      .delete()
      .eq('id', oldId);

    if (delErr) {
      console.error(`Failed to delete subcategory ${oldId}:`, delErr);
    } else {
      console.log(`Successfully deleted obsolete subcategory ${oldId}`);
    }
  }

  // Apply renames
  for (const r of renames) {
    console.log(`Renaming category ID ${r.id} to ${r.name}...`);
    const { error: renErr } = await supabase
      .from('categories')
      .update({ name: r.name, slug: r.slug, icon: r.icon })
      .eq('id', r.id);

    if (renErr) {
      console.error(`Failed to rename category ${r.id}:`, renErr);
    } else {
      console.log(`Successfully renamed category to ${r.name}`);
    }
  }

  // Insert/Check new subcategories
  for (const n of news) {
    console.log(`Checking/Inserting category: ${n.name}...`);
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('id', n.id)
      .maybeSingle();

    if (existing) {
      console.log(`  Already exists. Updating properties...`);
      const { error: upErr } = await supabase
        .from('categories')
        .update({ name: n.name, slug: n.slug, icon: n.icon, parent_id: parentId })
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
        icon: n.icon,
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
