-- Migration: Fix Category Foreign Key Deletion and Cascade
-- Run this in Supabase SQL Editor to allow smooth deletion of categories

-- 1. Modify listings category_id foreign key constraint to SET NULL or CASCADE
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_category_id_fkey;
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_subcategory_id_fkey;

-- Allow category_id to be set to NULL or CASCADE on delete
ALTER TABLE public.listings 
  ADD CONSTRAINT listings_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES public.categories(id) 
  ON DELETE CASCADE;

ALTER TABLE public.listings 
  ADD CONSTRAINT listings_subcategory_id_fkey 
  FOREIGN KEY (subcategory_id) 
  REFERENCES public.categories(id) 
  ON DELETE SET NULL;

-- 2. Modify categories parent_id foreign key constraint
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE public.categories 
  ADD CONSTRAINT categories_parent_id_fkey 
  FOREIGN KEY (parent_id) 
  REFERENCES public.categories(id) 
  ON DELETE CASCADE;
