import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Grid, List, SlidersHorizontal, MapPin, DollarSign, Tag, RefreshCw } from 'lucide-react';
import { listingsService } from '../services/listingsService';
import { Listing, Category, SearchFilters, ListingCondition } from '../types';
import ListingCard from '../components/listings/ListingCard';
import { Select, Spinner, EmptyState, Button } from '../components/ui';
import { SORT_OPTIONS, CITIES, CONDITIONS } from '../utils/constants';
import { cn, debounce } from '../utils/helpers';
import { categoriesService } from '../services';
import { supabase } from '../lib/supabase';

const ListingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    categoriesService.getCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || undefined,
    category_id: searchParams.get('category') || undefined,
    location: searchParams.get('location') || undefined,
    is_featured: searchParams.get('featured') === 'true' || undefined,
    sort_by: (searchParams.get('sort') as SearchFilters['sort_by']) || 'created_at',
  });

  const categoryName = filters.category_id
    ? categories.find(c => c.id === filters.category_id)?.name
    : null;

  const activeCat = filters.category_id ? categories.find(c => c.id === filters.category_id) : null;
  const isAnimalsCategory = Boolean(
    activeCat && (
      activeCat.id === 'c1000000-0000-0000-0000-000000000009' ||
      activeCat.slug === 'animals' || activeCat.slug === 'pets' ||
      activeCat.name === 'Animals' || activeCat.name === 'Pets' ||
      Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000000b')) ||
      Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000000c'))
    )
  );

  const isFashionCategory = Boolean(
    activeCat && (
      activeCat.id === 'c1000000-0000-0000-0000-000000000005' ||
      activeCat.slug === 'fashion-beauty' ||
      activeCat.name === 'Fashion & Beauty' ||
      Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000005'))
    )
  );

  const isServicesCategory = Boolean(
    activeCat && (
      activeCat.id === 'c1000000-0000-0000-0000-000000000007' ||
      activeCat.slug === 'services' || activeCat.name === 'Services' ||
      Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000000d')) ||
      Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000000e'))
    )
  );

  const isBusinessCategory = Boolean(
    activeCat && (
      activeCat.id === 'c1000000-0000-0000-0000-000000000011' ||
      activeCat.slug === 'business-industrial' || activeCat.name === 'Business & Industrial' ||
      Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000000f'))
    )
  );

  const isJobsCategory = Boolean(
    activeCat && (
      activeCat.id === 'c1000000-0000-0000-0000-000000000004' ||
      activeCat.slug === 'jobs' || activeCat.name === 'Jobs' ||
      Boolean(activeCat.id?.startsWith('d1000000-0000-0000-0000-000000004'))
    )
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchListings = useCallback(
    debounce(async (f: SearchFilters, p: number) => {
      setLoading(true);
      try {
        const res = await listingsService.getListings(f, p);
        setListings(res.data);
        setTotal(res.count);
        setTotalPages(res.total_pages);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    fetchListings(filters, page);
    // Update URL
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.category_id) params.set('category', filters.category_id);
    if (filters.location) params.set('location', filters.location);
    if (filters.is_featured) params.set('featured', 'true');
    if (filters.sort_by && filters.sort_by !== 'created_at') params.set('sort', filters.sort_by);
    setSearchParams(params);
  }, [filters, page, fetchListings, setSearchParams]);

  useEffect(() => {
    const channel = supabase
      .channel('listings-search-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchListings(filters, page);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [filters, page, fetchListings]);

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ sort_by: 'created_at' });
    setPage(1);
    setSearchParams({});
  };

  const getConditionsToUse = () => {
    if (!filters.category_id) return CONDITIONS;
    const cat = categories.find(c => c.id === filters.category_id);
    const parent = cat?.parent_id ? categories.find(c => c.id === cat.parent_id) : null;
    
    const isFurnitureConditionCat = (catId: string | undefined): boolean => {
      if (!catId) return false;
      const target = categories.find(c => c.id === catId);
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
      const target = categories.find(c => c.id === catId);
      if (!target) return false;
      if (
        target.id === 'c1000000-0000-0000-0000-000000000001' ||
        target.id === 'c1000000-0000-0000-0000-000000000099' ||
        target.id === 'c1000000-0000-0000-0000-000000000016' ||
        target.id === 'c1000000-0000-0000-0000-000000000005' ||
        target.id === 'c1000000-0000-0000-0000-000000000008' ||
        target.id === 'c1000000-0000-0000-0000-000000000010' ||
        target.id === 'c1000000-0000-0000-0000-000000000012' ||
        target.slug === 'vehicles' ||
        target.slug === 'bikes' ||
        target.slug === 'electronics-home-appliances' ||
        target.slug === 'fashion-beauty' ||
        target.slug === 'education' ||
        target.slug === 'sports-hobbies' ||
        target.slug === 'agriculture' ||
        target.name === 'Vehicles' ||
        target.name === 'Bikes' ||
        target.name === 'Electronics & Home Appliances' ||
        target.name === 'Fashion & Beauty' ||
        target.name === 'Education' ||
        target.name === 'Sports & Hobbies' ||
        target.name === 'Agriculture' ||
        Boolean(target.id?.startsWith('d1000000-') && !target.id?.startsWith('d1000000-0000-0000-0000-000000007'))
      ) {
        return true;
      }
      if (target.parent_id) return isSimplifiedConditionCat(target.parent_id);
      return false;
    };

    const checkKidsCategory = (catId: string | undefined): boolean => {
      if (!catId) return false;
      const target = categories.find(c => c.id === catId);
      if (!target) return false;
      if (target.id === 'c1000000-0000-0000-0000-000000000017' ||
          target.slug === 'kids' ||
          target.name === 'Kids' ||
          Boolean(target.id?.startsWith('d1000000-0000-0000-0000-000000007'))) {
        return true;
      }
      if (target.parent_id) return checkKidsCategory(target.parent_id);
      return false;
    };

    if (checkKidsCategory(filters.category_id)) {
      const isBathDiapers = (catId: string | undefined): boolean => {
        if (!catId) return false;
        const target = categories.find(c => c.id === catId);
        if (!target) return false;
        if (target.id === 'd1000000-0000-0000-0000-000000007005' ||
            Boolean(target.id?.startsWith('d1000000-0000-0000-0000-0000000075')) ||
            target.slug?.includes('bath-diapers') ||
            target.name?.includes('Bath & Diapers')) {
          return true;
        }
        if (target.parent_id) return isBathDiapers(target.parent_id);
        return false;
      };

      const isKidsClothing = (catId: string | undefined): boolean => {
        if (!catId) return false;
        const target = categories.find(c => c.id === catId);
        if (!target) return false;
        if (target.id === 'd1000000-0000-0000-0000-000000007007' ||
            Boolean(target.id?.startsWith('d1000000-0000-0000-0000-0000000077')) ||
            target.slug?.includes('clothing') ||
            target.name?.includes('Clothing')) {
          return true;
        }
        if (target.parent_id) return isKidsClothing(target.parent_id);
        return false;
      };

      if (isBathDiapers(filters.category_id)) {
        return CONDITIONS.filter(c => c.value === 'new');
      }
      if (isKidsClothing(filters.category_id)) {
        return CONDITIONS.filter(c => c.value === 'new' || c.value === 'good');
      }
      return CONDITIONS.filter(c => c.value === 'new' || c.value === 'like_new' || c.value === 'good');
    }

    if (isFurnitureConditionCat(filters.category_id)) {
      return [
        { value: 'new', label: 'New' },
        { value: 'like_new', label: 'Like New' },
        { value: 'good', label: 'Gently Used' },
        { value: 'fair', label: 'Used' },
        { value: 'poor', label: 'Needs Repair' }
      ];
    }

    if (isSimplifiedConditionCat(filters.category_id)) {
      return CONDITIONS.filter(c => c.value === 'new' || c.value === 'good');
    }

    const isUnderAccessories = cat?.id === 'c1000000-0000-0000-0000-000000000118' ||
      cat?.slug === 'electronics-accessories' ||
      cat?.name === 'Accessories' ||
      parent?.id === 'c1000000-0000-0000-0000-000000000118' ||
      parent?.slug === 'electronics-accessories' ||
      parent?.name === 'Accessories';

    const isUnderCamera = cat?.id === 'c1000000-0000-0000-0000-000000000116' ||
      cat?.slug === 'cameras' ||
      cat?.name === 'Cameras' ||
      cat?.name === 'Camera & Accessories' ||
      parent?.id === 'c1000000-0000-0000-0000-000000000116' ||
      parent?.slug === 'cameras' ||
      parent?.name === 'Cameras' ||
      parent?.name === 'Camera & Accessories';

    const isComputerOtherAcc = cat?.id === '3a4d9e5c-96b9-4787-b9b2-229dbdc869b2' ||
      cat?.slug?.includes('other-accessories') ||
      cat?.name === 'Other Accessories' ||
      parent?.id === '3a4d9e5c-96b9-4787-b9b2-229dbdc869b2' ||
      parent?.slug?.includes('other-accessories') ||
      parent?.name === 'Other Accessories';

    if (isUnderAccessories || isUnderCamera || isComputerOtherAcc) {
      return CONDITIONS.filter(c => c.value === 'new' || c.value === 'good');
    }
    return CONDITIONS;
  };

  const conditionsToUse = getConditionsToUse();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {categoryName ? categoryName : filters.query ? `Results for "${filters.query}"` : 'All Listings'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {loading ? 'Searching...' : `${total.toLocaleString()} listings found`}
        </p>
      </div>

      {/* Premium Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-none mb-6 transition-all duration-300">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="text-primary-500 w-4 h-4" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wide uppercase">Filter Listings</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* City select pill */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <MapPin size={16} />
            </div>
            <select
              value={filters.location || ''}
              onChange={e => handleFilterChange({ ...filters, location: e.target.value || undefined })}
              className="w-full pl-10 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl cursor-pointer transition-all duration-200 appearance-none"
            >
              <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Cities</option>
              {CITIES.map(city => (
                <option key={city} value={city} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{city}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Sex/Gender select pill */}
          {(isAnimalsCategory || isFashionCategory) && (
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                <Tag size={16} />
              </div>
              <select
                value={filters.sex || ''}
                onChange={e => handleFilterChange({ ...filters, sex: e.target.value || undefined })}
                className="w-full pl-10 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl cursor-pointer transition-all duration-200 appearance-none"
              >
                {isFashionCategory ? (
                  <>
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Genders</option>
                    <option value="Men" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Men</option>
                    <option value="Women" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Women</option>
                    <option value="Unisex" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Unisex</option>
                    <option value="Boys" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Boys</option>
                    <option value="Girls" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Girls</option>
                  </>
                ) : (
                  <>
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Sex</option>
                    <option value="Male" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Male</option>
                    <option value="Female" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Female</option>
                    <option value="Pair" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Pair</option>
                  </>
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          )}

          {/* Condition select pill */}
          {!isAnimalsCategory && !isServicesCategory && !isBusinessCategory && !isJobsCategory && (
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                <Tag size={16} />
              </div>
              <select
                value={filters.condition || ''}
                onChange={e => handleFilterChange({ ...filters, condition: (e.target.value || undefined) as ListingCondition | undefined })}
                className="w-full pl-10 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-slate-700 dark:text-slate-200 font-semibold rounded-2xl cursor-pointer transition-all duration-200 appearance-none"
              >
                <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">All Conditions</option>
                {conditionsToUse.map(c => (
                  <option key={c.value} value={c.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{c.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          )}

          {/* Price Range Card / Pill */}
          {!isServicesCategory && !isJobsCategory && (
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-1 flex-1 min-w-[260px] gap-2 transition-all duration-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
              <div className="text-slate-400 dark:text-slate-500">
                <DollarSign size={16} />
              </div>
              <input
                type="number"
                placeholder="Min Price"
                value={filters.min_price || ''}
                onChange={e => handleFilterChange({ ...filters, min_price: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full bg-transparent border-0 py-1.5 text-sm focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 font-semibold placeholder-slate-400"
              />
              <span className="text-slate-300 dark:text-slate-650 font-bold px-1">|</span>
              <input
                type="number"
                placeholder="Max Price"
                value={filters.max_price || ''}
                onChange={e => handleFilterChange({ ...filters, max_price: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full bg-transparent border-0 py-1.5 text-sm focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-200 font-semibold placeholder-slate-400"
              />
            </div>
          )}

          {/* Reset Filters */}
          {(filters.location || filters.condition || filters.min_price || filters.max_price) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-500 hover:text-white dark:text-red-400 hover:bg-red-500 dark:hover:bg-red-600 rounded-2xl transition-all duration-250 border border-red-200 dark:border-red-950/40 hover:border-transparent active:scale-[0.98]"
            >
              <RefreshCw size={12} />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 rounded-xl transition-colors', viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300')}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 rounded-xl transition-colors', viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300')}
            >
              <List size={18} />
            </button>
          </div>

          <Select
            options={SORT_OPTIONS}
            value={filters.sort_by || 'created_at'}
            onChange={e => handleFilterChange({ ...filters, sort_by: e.target.value as SearchFilters['sort_by'] })}
            className="text-sm w-44"
          />
        </div>

          {/* Listings grid/list */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size={36} />
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={<SlidersHorizontal size={28} />}
              title="No listings found"
              description="Try adjusting your filters or search terms to find what you're looking for."
              action={
                <Button variant="outline" onClick={handleReset}>Clear filters</Button>
              }
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-3'
              )}
            >
              {listings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  variant={viewMode}
                />
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'w-9 h-9 rounded-xl text-sm font-medium transition-colors',
                        page === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
      </div>
    </div>
  );
};

export default ListingsPage;
