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

  // 1. Cars Accessories (c1000000-0000-0000-0000-000000000183)
  const accParent = 'c1000000-0000-0000-0000-000000000183';
  const accSubSubs = [
    { id: 'c1000000-0000-0000-0000-000000000271', name: 'Tools & Gadgets', slug: 'acc-tools-gadgets' },
    { id: 'c1000000-0000-0000-0000-000000000272', name: 'Safety & Security', slug: 'acc-safety-security' },
    { id: 'c1000000-0000-0000-0000-000000000273', name: 'Audio & Multimedia', slug: 'acc-audio-multimedia' },
    { id: 'c1000000-0000-0000-0000-000000000274', name: 'Interior', slug: 'acc-interior' },
    { id: 'c1000000-0000-0000-0000-000000000275', name: 'Exterior', slug: 'acc-exterior' },
    { id: 'c1000000-0000-0000-0000-000000000276', name: 'Paints, Primers & Tools', slug: 'acc-paints-primers-tools' }
  ];

  // 2. Spare Parts (actual database ID is cc0c0e8e-757b-42c8-8598-872fb6c6d870, rename Auto Parts -> Spare Parts)
  const partsParent = 'cc0c0e8e-757b-42c8-8598-872fb6c6d870';
  console.log('Renaming database category to Spare Parts...');
  await supabase
    .from('categories')
    .update({ name: 'Spare Parts', slug: 'spare-parts' })
    .eq('id', partsParent);
  const partsSubSubs = [
    { id: 'c1000000-0000-0000-0000-000000000281', name: 'Tyres', slug: 'parts-tyres' },
    { id: 'c1000000-0000-0000-0000-000000000282', name: 'Lights', slug: 'parts-lights' },
    { id: 'c1000000-0000-0000-0000-000000000283', name: 'Bumpers', slug: 'parts-bumpers' },
    { id: 'c1000000-0000-0000-0000-000000000284', name: 'Batteries', slug: 'parts-batteries' },
    { id: 'c1000000-0000-0000-0000-000000000285', name: 'Engines', slug: 'parts-engines' },
    { id: 'c1000000-0000-0000-0000-000000000286', name: 'Doors & Components', slug: 'parts-doors-components' },
    { id: 'c1000000-0000-0000-0000-000000000287', name: 'Suspension Parts', slug: 'parts-suspension' },
    { id: 'c1000000-0000-0000-0000-000000000288', name: 'Windscreen', slug: 'parts-windscreen' },
    { id: 'c1000000-0000-0000-0000-000000000289', name: 'AC & Heating', slug: 'parts-ac-heating' },
    { id: 'c1000000-0000-0000-0000-000000000290', name: 'Fenders', slug: 'parts-fenders' },
    { id: 'c1000000-0000-0000-0000-000000000291', name: 'Trunk Parts', slug: 'parts-trunk' },
    { id: 'c1000000-0000-0000-0000-000000000292', name: 'Mirrors', slug: 'parts-mirrors' },
    { id: 'c1000000-0000-0000-0000-000000000293', name: 'Power Steerings', slug: 'parts-power-steering' },
    { id: 'c1000000-0000-0000-0000-000000000294', name: 'Front Grills', slug: 'parts-front-grills' },
    { id: 'c1000000-0000-0000-0000-000000000295', name: 'Gaskets & Seals', slug: 'parts-gaskets-seals' },
    { id: 'c1000000-0000-0000-0000-000000000296', name: 'Spark Plugs', slug: 'parts-spark-plugs' },
    { id: 'c1000000-0000-0000-0000-000000000297', name: 'Bonnets', slug: 'parts-bonnets' },
    { id: 'c1000000-0000-0000-0000-000000000298', name: 'Radiator & Coolants', slug: 'parts-radiator-coolants' },
    { id: 'c1000000-0000-0000-0000-000000000299', name: 'Horns', slug: 'parts-horns' },
    { id: 'c1000000-0000-0000-0000-000000000300', name: 'Ignition Coils', slug: 'parts-ignition-coils' },
    { id: 'c1000000-0000-0000-0000-000000000301', name: 'Fuel Pump', slug: 'parts-fuel-pump' },
    { id: 'c1000000-0000-0000-0000-000000000302', name: 'Antennas', slug: 'parts-antennas' },
    { id: 'c1000000-0000-0000-0000-000000000303', name: 'Wipers', slug: 'parts-wipers' },
    { id: 'c1000000-0000-0000-0000-000000000304', name: 'Bushing', slug: 'parts-bushing' },
    { id: 'c1000000-0000-0000-0000-000000000305', name: 'Buttons', slug: 'parts-buttons' },
    { id: 'c1000000-0000-0000-0000-000000000306', name: 'Catalytic Converters', slug: 'parts-catalytic-converters' },
    { id: 'c1000000-0000-0000-0000-000000000307', name: 'Ignition Switches', slug: 'parts-ignition-switches' },
    { id: 'c1000000-0000-0000-0000-000000000308', name: 'Engine Shields', slug: 'parts-engine-shields' },
    { id: 'c1000000-0000-0000-0000-000000000309', name: 'Oxygen Sensors', slug: 'parts-oxygen-sensors' },
    { id: 'c1000000-0000-0000-0000-000000000310', name: 'Fenders & Body Parts', slug: 'parts-fenders-body-parts' },
    { id: 'c1000000-0000-0000-0000-000000000311', name: 'Filters', slug: 'parts-filters' },
    { id: 'c1000000-0000-0000-0000-000000000312', name: 'Brakes', slug: 'parts-brakes' },
    { id: 'c1000000-0000-0000-0000-000000000313', name: 'Sun Visor', slug: 'parts-sun-visor' },
    { id: 'c1000000-0000-0000-0000-000000000314', name: 'Insulation Sheets', slug: 'parts-insulation-sheets' },
    { id: 'c1000000-0000-0000-0000-000000000315', name: 'Alternators & Generators', slug: 'parts-alternators-generators' },
    { id: 'c1000000-0000-0000-0000-000000000316', name: 'Bearings', slug: 'parts-bearings' },
    { id: 'c1000000-0000-0000-0000-000000000317', name: 'Exhaust System', slug: 'parts-exhaust' },
    { id: 'c1000000-0000-0000-0000-000000000318', name: 'Belts & Cables', slug: 'parts-belts-cables' },
    { id: 'c1000000-0000-0000-0000-000000000319', name: 'Electrical & Wiring', slug: 'parts-electrical-wiring' },
    { id: 'c1000000-0000-0000-0000-000000000320', name: 'Spark Plugs & Ingition Coils', slug: 'parts-spark-plugs-ignition' },
    { id: 'c1000000-0000-0000-0000-000000000321', name: 'Waterbody & Water Pumps', slug: 'parts-waterbody-pumps' },
    { id: 'c1000000-0000-0000-0000-000000000322', name: 'Hose, Lines & Fittings', slug: 'parts-hose-lines-fittings' },
    { id: 'c1000000-0000-0000-0000-000000000323', name: 'Sunroofs', slug: 'parts-sunroofs' },
    { id: 'c1000000-0000-0000-0000-000000000324', name: 'Other Parts', slug: 'parts-other' },
    { id: 'c1000000-0000-0000-0000-000000000325', name: 'Lock Nut Kits & Spindles', slug: 'parts-lock-nut-spindles' },
    { id: 'c1000000-0000-0000-0000-000000000326', name: 'Gearboxes & Transfer Cases', slug: 'parts-gearboxes-transfer-cases' }
  ];

  // 3. Oil & Lubricants (c1000000-0000-0000-0000-000000000184)
  const oilParent = 'c1000000-0000-0000-0000-000000000184';
  const oilSubSubs = [
    { id: 'c1000000-0000-0000-0000-000000000331', name: 'Engine Oil', slug: 'oil-engine' },
    { id: 'c1000000-0000-0000-0000-000000000332', name: 'Gear Oil', slug: 'oil-gear' },
    { id: 'c1000000-0000-0000-0000-000000000333', name: 'Coolants', slug: 'oil-coolants' },
    { id: 'c1000000-0000-0000-0000-000000000334', name: 'CVTF Oil', slug: 'oil-cvtf' },
    { id: 'c1000000-0000-0000-0000-000000000335', name: 'Fluids & Flushes', slug: 'oil-fluids-flushes' },
    { id: 'c1000000-0000-0000-0000-000000000336', name: 'Brake Oil', slug: 'oil-brake' },
    { id: 'c1000000-0000-0000-0000-000000000337', name: 'Fuel Additives', slug: 'oil-fuel-additives' },
    { id: 'c1000000-0000-0000-0000-000000000338', name: 'Oil Additives', slug: 'oil-additives' },
    { id: 'c1000000-0000-0000-0000-000000000339', name: 'Multipurpose Grease', slug: 'oil-grease' },
    { id: 'c1000000-0000-0000-0000-000000000340', name: 'Chain Lubes & Cleaners', slug: 'oil-chain-lubes-cleaners' },
    { id: 'c1000000-0000-0000-0000-000000000341', name: 'Adhesives', slug: 'oil-adhesives' },
    { id: 'c1000000-0000-0000-0000-000000000342', name: 'Solvents', slug: 'oil-solvents' }
  ];

  const allSubSubs = [
    { parentId: accParent, items: accSubSubs },
    { parentId: partsParent, items: partsSubSubs },
    { parentId: oilParent, items: oilSubSubs }
  ];

  for (const group of allSubSubs) {
    for (const n of group.items) {
      console.log(`Checking/Inserting sub-subcategory: ${n.name}...`);
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('id', n.id)
        .maybeSingle();

      if (existing) {
        console.log(`  Already exists. Updating parent...`);
        const { error: upErr } = await supabase
          .from('categories')
          .update({ name: n.name, slug: n.slug, parent_id: group.parentId })
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
          parent_id: group.parentId,
          icon: 'Settings',
          color: '#ef4444',
          is_active: true
        });

      if (insErr) {
        console.error(`  Failed to insert category ${n.name}:`, insErr);
      } else {
        console.log(`  Successfully inserted category ${n.name}`);
      }
    }
  }

  console.log('Done database modifications!');
}

setup();
