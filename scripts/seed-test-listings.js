import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const IMAGES = {
  vehicles: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  property: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
  electronics: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
  jobs: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
  fashion: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
  furniture: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
  services: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  pets: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
  others: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
};

function getImageUrlForSlug(slug) {
  const lower = slug.toLowerCase();
  for (const [key, val] of Object.entries(IMAGES)) {
    if (lower.includes(key)) return val;
  }
  return IMAGES.others;
}

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar'];

async function seed() {
  try {
    // Sign in as Super Admin
    console.log('Logging in to Supabase...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'classifiedallinon@gmail.com',
      password: 'Abdullah0090@'
    });
    if (authError) throw authError;
    console.log('Authenticated successfully as Super Admin:', authData.user.email);

    // 1. Fetch categories
    const { data: categories, error: catError } = await supabase.from('categories').select('*');
    if (catError) throw catError;
    console.log(`Fetched ${categories.length} categories.`);

    // 2. Fetch a seller or use current user (super admin is also a user)
    const sellerId = authData.user.id;
    console.log(`Using sellerId: ${sellerId}`);

    const listingsToInsert = [];

    // Create a dictionary of categories for quick lookup
    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c; });

    // Loop through all categories (both parent and subcategories)
    for (const cat of categories) {
      const isSub = !!cat.parent_id;
      const mainCat = isSub ? catMap[cat.parent_id] : cat;
      if (!mainCat) continue;

      const imageUrl = getImageUrlForSlug(cat.slug) || getImageUrlForSlug(mainCat.slug);
      
      const listingsForThisCat = [
        {
          title: `Premium ${cat.name} Special Offer`,
          description: `This is a premium, verified test listing for ${cat.name}. Excellent condition, highly recommended.`,
          price: Math.floor(Math.random() * 95000) + 5000,
          currency: 'PKR',
          category_id: mainCat.id,
          subcategory_id: isSub ? cat.id : null,
          seller_id: sellerId,
          status: 'active',
          condition: 'like_new',
          images: [imageUrl],
          location: 'Test Location, Near Main Road',
          city: CITIES[Math.floor(Math.random() * CITIES.length)],
          country: 'Pakistan',
          is_featured: true,
          is_negotiable: true,
          views_count: Math.floor(Math.random() * 100)
        },
        {
          title: `Budget Friendly ${cat.name}`,
          description: `Affordable and reliable option for ${cat.name}. Slightly used but in great shape.`,
          price: Math.floor(Math.random() * 20000) + 1000,
          currency: 'PKR',
          category_id: mainCat.id,
          subcategory_id: isSub ? cat.id : null,
          seller_id: sellerId,
          status: 'active',
          condition: 'good',
          images: [imageUrl],
          location: 'Downtown Market Area',
          city: CITIES[Math.floor(Math.random() * CITIES.length)],
          country: 'Pakistan',
          is_featured: false,
          is_negotiable: false,
          views_count: Math.floor(Math.random() * 50)
        }
      ];

      listingsToInsert.push(...listingsForThisCat);
    }

    console.log(`Prepared ${listingsToInsert.length} test listings to insert.`);

    // Insert listings in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < listingsToInsert.length; i += chunkSize) {
      const chunk = listingsToInsert.slice(i, i + chunkSize);
      const { data, error } = await supabase.from('listings').insert(chunk).select('id');
      if (error) {
        console.error(`Error inserting chunk starting at index ${i}:`, error);
      } else {
        console.log(`Successfully inserted chunk: ${i} to ${i + chunk.length}`);
      }
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seed();
