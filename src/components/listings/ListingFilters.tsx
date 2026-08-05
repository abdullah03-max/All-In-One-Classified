import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchFilters, Category } from '../../types';
import { Button, Input, Select } from '../ui';
import { CONDITIONS, CITIES } from '../../utils/constants';
import { cn } from '../../utils/helpers';
import { categoriesService } from '../../services';

interface ListingFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = true
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 dark:border-slate-700 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ListingFilters: React.FC<ListingFiltersProps> = ({ filters, onChange, onReset }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoriesService.getCategories()
      .then(allCats => {
        setCategories(allCats.filter(c => !c.parent_id));
        setAllCategories(allCats as unknown as Category[]);
      })
      .catch(console.error);
  }, []);

  const handleChange = (key: keyof SearchFilters, value: unknown) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  const FilterContent = () => (
    <div className="space-y-0">
      {/* Price Range */}
      <Section title="Price Range">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.min_price ?? ''}
            onChange={e => handleChange('min_price', e.target.value ? Number(e.target.value) : undefined)}
            className="text-sm"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.max_price ?? ''}
            onChange={e => handleChange('max_price', e.target.value ? Number(e.target.value) : undefined)}
            className="text-sm"
          />
        </div>
      </Section>

      {/* Condition */}
      {(() => {
        const activeCat = allCategories.find(c => c.id === filters.category_id);
        const isServicesFilter = Boolean(activeCat && (
          activeCat.id === 'c1000000-0000-0000-0000-000000000007' ||
          activeCat.slug === 'services' || activeCat.name === 'Services' ||
          Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000000d')) ||
          Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000000e'))
        ));
        const isBusinessFilter = Boolean(activeCat && (
          activeCat.id === 'c1000000-0000-0000-0000-000000000011' ||
          activeCat.slug === 'business-industrial' || activeCat.name === 'Business & Industrial' ||
          Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000000f'))
        ));
        const isJobsFilter = Boolean(activeCat && (
          activeCat.id === 'c1000000-0000-0000-0000-000000000004' ||
          activeCat.slug === 'jobs' || activeCat.name === 'Jobs' ||
          Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000004'))
        ));

        if (isServicesFilter || isBusinessFilter || isJobsFilter) return null;

        return (
          <Section title="Condition">
            <div className="space-y-2">
              {(() => {
                const currentCategory = allCategories.find(c => c.id === filters.category_id);
                const parentCategory = currentCategory?.parent_id 
                  ? allCategories.find(c => c.id === currentCategory.parent_id)
                  : null;

                const isFurnitureConditionCat = (catId: string | undefined): boolean => {
                  if (!catId) return false;
                  const target = allCategories.find(c => c.id === catId);
                  if (!target) return false;
                  if (
                    target.id === 'c1000000-0000-0000-0000-000000000006' ||
                    target.slug === 'furniture-home-decor' ||
                    target.name === 'Furniture & Home Decor' ||
                    Boolean(target.id?.startsWith('d1000000-0000-0000-0000-00000000031')) ||
                    Boolean(target.id?.startsWith('d1000000-0000-0000-0000-00000000032')) ||
                    Boolean(target.id?.startsWith('d1000000-0000-0000-0000-000000001')) ||
                    Boolean(target.id?.startsWith('d1000000-0000-0000-0000-000000002'))
                  ) {
                    return true;
                  }
                  if (target.parent_id) return isFurnitureConditionCat(target.parent_id);
                  return false;
                };

                const isSimplifiedConditionCat = (catId: string | undefined): boolean => {
                  if (!catId) return false;
                  const target = allCategories.find(c => c.id === catId);
                  if (!target) return false;
                  if (
                    target.id === 'c1000000-0000-0000-0000-000000000001' ||
                    target.id === 'c1000000-0000-0000-0000-000000000099' ||
                    target.id === 'c1000000-0000-0000-0000-000000000016' ||
                    target.id === 'c1000000-0000-0000-0000-000000000005' ||
                    target.slug === 'vehicles' ||
                    target.slug === 'bikes' ||
                    target.slug === 'electronics-home-appliances' ||
                    target.slug === 'fashion-beauty' ||
                    target.name === 'Vehicles' ||
                    target.name === 'Bikes' ||
                    target.name === 'Electronics & Home Appliances' ||
                    target.name === 'Fashion & Beauty' ||
                    Boolean(target.id?.startsWith('d1000000-'))
                  ) {
                    return true;
                  }
                  if (target.parent_id) return isSimplifiedConditionCat(target.parent_id);
                  return false;
                };

                const isAccessoriesOrCameraOrCompAccFilter = currentCategory?.id === 'c1000000-0000-0000-0000-000000000118' ||
                  currentCategory?.slug === 'electronics-accessories' ||
                  currentCategory?.name === 'Accessories' ||
                  parentCategory?.id === 'c1000000-0000-0000-0000-000000000118' ||
                  parentCategory?.slug === 'electronics-accessories' ||
                  parentCategory?.name === 'Accessories' ||
                  currentCategory?.id === 'c1000000-0000-0000-0000-000000000116' ||
                  currentCategory?.slug === 'cameras' ||
                  currentCategory?.name === 'Cameras' ||
                  currentCategory?.name === 'Camera & Accessories' ||
                  parentCategory?.id === 'c1000000-0000-0000-0000-000000000116' ||
                  parentCategory?.slug === 'cameras' ||
                  parentCategory?.name === 'Cameras' ||
                  parentCategory?.name === 'Camera & Accessories' ||
                  currentCategory?.id === '3a4d9e5c-96b9-4787-b9b2-229dbdc869b2' ||
                  currentCategory?.slug?.includes('other-accessories') ||
                  currentCategory?.name === 'Other Accessories' ||
                  parentCategory?.id === '3a4d9e5c-96b9-4787-b9b2-229dbdc869b2' ||
                  parentCategory?.slug?.includes('other-accessories') ||
                  parentCategory?.name === 'Other Accessories';

                const conditionsToUse = isFurnitureConditionCat(filters.category_id)
                  ? [
                      { value: 'new', label: 'New' },
                      { value: 'like_new', label: 'Like New' },
                      { value: 'good', label: 'Gently Used' },
                      { value: 'fair', label: 'Used' },
                      { value: 'poor', label: 'Needs Repair' }
                    ]
                  : (isSimplifiedConditionCat(filters.category_id) || isAccessoriesOrCameraOrCompAccFilter)
                  ? CONDITIONS.filter(c => c.value === 'new' || c.value === 'good')
                  : CONDITIONS;

                return conditionsToUse.map(c => (
                  <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      value={c.value}
                      checked={filters.condition === c.value}
                      onChange={() => handleChange('condition', c.value)}
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{c.label}</span>
                  </label>
                ));
              })()}
              {filters.condition && (
                <button onClick={() => handleChange('condition', undefined)} className="text-xs text-primary-600 hover:underline">Clear</button>
              )}
            </div>
          </Section>
        );
      })()}

      {/* Location */}
      <Section title="City">
        <Select
          options={CITIES.map(c => ({ value: c, label: c }))}
          value={filters.location || ''}
          onChange={e => handleChange('location', e.target.value)}
          placeholder="All Cities"
          className="text-sm"
        />
      </Section>

      {/* Category */}
      <Section title="Category">
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleChange('category_id', cat.id === filters.category_id ? undefined : cat.id)}
              className={cn(
                'w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                filters.category_id === cat.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </Section>

      {/* Featured */}
      <Section title="Listing Type">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.is_featured ?? false}
            onChange={e => handleChange('is_featured', e.target.checked || undefined)}
            className="accent-primary-600 rounded"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">Featured only</span>
        </label>
      </Section>

      {/* Reset */}
      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={onReset}>
          Clear all filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="secondary"
          icon={<SlidersHorizontal size={16} />}
          onClick={() => setMobileOpen(true)}
        >
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-80 bg-white dark:bg-slate-800 h-full overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Filters</h2>
                <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4"><FilterContent /></div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <Button className="w-full" onClick={() => setMobileOpen(false)}>Apply Filters</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:block card p-4 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal size={16} /> Filters
          </h2>
          {activeFilterCount > 0 && (
            <button onClick={onReset} className="text-xs text-red-500 hover:underline">Reset all</button>
          )}
        </div>
        <FilterContent />
      </div>
    </>
  );
};

export default ListingFilters;
