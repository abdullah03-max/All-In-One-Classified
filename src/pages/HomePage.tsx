import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Shield, Zap, Star, ArrowRight, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { CITIES } from '../utils/constants';
import { listingsService } from '../services/listingsService';
import { categoriesService } from '../services';
import { Listing, Category } from '../types';
import ListingCard from '../components/listings/ListingCard';
import Icon from '../components/ui/Icon';
import { Skeleton } from '../components/ui';
import { formatNumber, userHasAnyRole } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const CategorySection: React.FC<{
  category: Category;
  listings: Listing[];
  isLoading: boolean;
}> = ({ category, listings, isLoading }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!isLoading && listings.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 border-b border-slate-100 dark:border-slate-800 last:border-0 relative group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {category.icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: (category.color || '#3b82f6') + '20' }}
            >
              <Icon name={category.icon} size={20} style={{ color: category.color || '#3b82f6' }} />
            </div>
          )}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{category.name}</h2>
        </div>
        <Link
          to={`/category/${category.slug}`}
          className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="relative">
        {/* Scroll Buttons */}
        {!isLoading && listings.length > 0 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-64 shrink-0 snap-start">
                <div className="card overflow-hidden">
                  <Skeleton className="h-40 rounded-t-2xl rounded-b-none" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))
            : listings.map(listing => (
              <div key={listing.id} className="w-64 shrink-0 snap-start">
                <ListingCard listing={listing} />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [listingsByCategory, setListingsByCategory] = useState<Record<string, Listing[]>>({});
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingListings, setLoadingListings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && user) {
      if (userHasAnyRole(user, ['super_admin'])) {
        navigate('/superadmin', { replace: true });
        return;
      }
      if (userHasAnyRole(user, ['admin'])) {
        navigate('/admin', { replace: true });
        return;
      }
      if (userHasAnyRole(user, ['moderator'])) {
        navigate('/moderator', { replace: true });
        return;
      }
    }

    const loadData = () => {
      listingsService.getFeaturedListings()
        .then(setFeaturedListings)
        .catch(console.error)
        .finally(() => setLoadingFeatured(false));

      categoriesService.getCategories()
        .then(allCats => {
          const mainCats = allCats.filter(c => !c.parent_id);
          setCategories(mainCats);
          setLoadingCategories(false);

          // Fetch listings for each main category (up to 12 items, premium first)
          mainCats.forEach(cat => {
            setLoadingListings(prev => ({ ...prev, [cat.id]: true }));
            listingsService.getCategoryListingsHome(cat.id, 12)
              .then(listings => {
                setListingsByCategory(prev => ({ ...prev, [cat.id]: listings }));
              })
              .catch(console.error)
              .finally(() => {
                setLoadingListings(prev => ({ ...prev, [cat.id]: false }));
              });
          });
        })
        .catch(err => {
          console.error(err);
          setLoadingCategories(false);
        });
    };

    loadData();

    // Subscribe to listings table changes (realtime)
    const channel = supabase
      .channel('home-listings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, loading, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCity) params.set('location', selectedCity);
    navigate(`/listings?${params.toString()}`);
  };

  const stats = [
    { label: 'Active Listings', value: formatNumber(50000), icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Verified Sellers', value: formatNumber(12000), icon: Shield, color: 'text-green-600' },
    { label: 'Cities Covered', value: '20+', icon: MapPin, color: 'text-purple-600' },
    { label: 'Daily Transactions', value: formatNumber(5000), icon: Zap, color: 'text-amber-600' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm px-4 py-1.5 rounded-full mb-6">
              <Star size={14} className="text-amber-400" />
              Pakistan's #1 Online Marketplace
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              Buy & Sell
              <span className="text-accent-300"> Anything</span>
              <br />Across Pakistan
            </h1>
            <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
              From mobile & tech products to real estate, vehicles to fashion — discover amazing deals or post your own free ad today.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="What are you looking for?"
                  className="w-full pl-11 pr-4 py-4 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-400 text-base"
                />
              </div>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="px-4 py-4 rounded-2xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-accent-400 sm:w-40 bg-white"
              >
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                type="submit"
                className="px-8 py-4 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-2xl transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </form>

            {/* Quick category pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Cars', 'Mobile Phones', 'Property for Sale', 'Property for Rent', 'Electronics & Home Appliances', 'Jobs'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSearchQuery(cat)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-full border border-white/20 transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <stat.icon size={22} className={`${stat.color} mb-1`} />
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Browse Categories</h2>
          <Link to="/listings" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {loadingCategories
            ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <Skeleton className="w-12 h-12 rounded-xl mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))
            : categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/category/${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: (cat.color || '#3b82f6') + '20' }}
                  >
                    <Icon name={cat.icon} size={24} style={{ color: cat.color || '#3b82f6' }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">{cat.name}</span>
                </Link>
              </motion.div>
            ))}
        </div>
      </section>

      {/* Featured Listings */}
      {(loadingFeatured || featuredListings.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 py-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star size={20} className="text-accent-500" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Featured Listings</h2>
            </div>
            <Link to="/listings?featured=true" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {loadingFeatured
              ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <Skeleton className="h-40 rounded-t-2xl rounded-b-none" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
              : featuredListings.slice(0, 12).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
          </div>
        </section>
      )}

      {/* Category-wise Sections */}
      {loadingCategories
        ? Array.from({ length: 3 }).map((_, i) => (
          <section key={i} className="max-w-7xl mx-auto px-4 py-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="w-64 shrink-0">
                  <div className="card overflow-hidden">
                    <Skeleton className="h-40 rounded-t-2xl rounded-b-none" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
        : categories.map(cat => (
          <CategorySection
            key={cat.id}
            category={cat}
            listings={listingsByCategory[cat.id] || []}
            isLoading={loadingListings[cat.id]}
          />
        ))}

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-accent-500 to-accent-600">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Sell?</h2>
          <p className="text-accent-100 mb-6 text-lg">Post your first ad for free and reach thousands of buyers today.</p>
          <Link
            to={user ? '/dashboard/listings/new' : '/register'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-accent-600 font-bold rounded-2xl hover:bg-accent-50 transition-colors shadow-lg"
          >
            Post Free Ad <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;