import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve('d:/marketplace/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const parentId = '3a4d9e5c-96b9-4787-b9b2-229dbdc869b2'; // Other Accessories parent

async function run() {
  console.log('Logging in...');
  await supabase.auth.signInWithPassword({
    email: 'classifiedallinon@gmail.com',
    password: 'Abdullah0090@'
  });

  // Find the sub-subcategory named 'Other Accessories' under Computers -> Other Accessories
  const { data: cat, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('parent_id', parentId)
    .eq('name', 'Other Accessories')
    .single();

  if (error) {
    console.error('Error finding sub-subcategory:', error);
    return;
  }

  if (cat) {
    console.log(`Found target category to delete: ${cat.name} (${cat.id})`);
    
    // Check if there are any listings associated with this category
    const { count, error: countErr } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', cat.id);

    if (countErr) {
      console.error('Error counting listings:', countErr);
      return;
    }

    console.log(`Number of listings associated: ${count}`);

    if (count && count > 0) {
      // Re-assign those listings to the parent category (Other Accessories parent)
      console.log(`Re-assigning ${count} listings to parent category ID ${parentId}...`);
      const { error: updateErr } = await supabase
        .from('listings')
        .update({ category_id: parentId })
        .eq('category_id', cat.id);

      if (updateErr) {
        console.error('Failed to update listings:', updateErr);
        return;
      }
      console.log('Successfully re-assigned listings.');
    }

    // Now delete the category safely
    console.log(`Deleting category: ${cat.name} (${cat.id})...`);
    const { error: deleteErr } = await supabase
      .from('categories')
      .delete()
      .eq('id', cat.id);

    if (deleteErr) {
      console.error('Failed to delete category:', deleteErr);
    } else {
      console.log('Successfully deleted the sub-subcategory!');
    }
  } else {
    console.log('Category not found.');
  }
}

run();
