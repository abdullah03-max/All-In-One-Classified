import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Search, TrendingUp, Shield, Zap, Star, ArrowRight, MapPin, ChevronLeft, ChevronRight, Smartphone, Car, Building2, Briefcase, Sparkles, ChevronDown } from 'lucide-react';
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
import { Marketplace3DHero } from '../components/home/Marketplace3DHero';

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
    <section className="max-w-7xl mx-auto px-4 py-8 border-b border-slate-100 dark:border-slate-800/80 last:border-0 relative group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {category.icon && (
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs"
              style={{ backgroundColor: (category.color || '#3b82f6') + '20' }}
            >
              <Icon name={category.icon} size={22} style={{ color: category.color || '#3b82f6' }} />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{category.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Discover verified listings in {category.name}</p>
          </div>
        </div>
        <Link
          to={`/category/${category.slug}`}
          className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 transition-all hover:gap-2"
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
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer backdrop-blur-md"
            >
              <ChevronLeft size={20} className="text-slate-700 dark:text-slate-200" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer backdrop-blur-md"
            >
              <ChevronRight size={20} className="text-slate-700 dark:text-slate-200" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-64 shrink-0 snap-start">
                <div className="card overflow-hidden rounded-2xl">
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

  // 3D Scroll Story Container Setup
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: storyContainerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 24,
    restDelta: 0.001
  });

  const [rawProgress, setRawProgress] = useState(0);

  useEffect(() => {
    return smoothProgress.on('change', (latest) => {
      setRawProgress(latest);
    });
  }, [smoothProgress]);

  // Transform values for text overlays
  const stage0Opacity = useTransform(smoothProgress, [0, 0.12, 0.18], [1, 1, 0]);
  const stage1Opacity = useTransform(smoothProgress, [0.18, 0.25, 0.35, 0.38], [0, 1, 1, 0]);
  const stage2Opacity = useTransform(smoothProgress, [0.38, 0.45, 0.55, 0.58], [0, 1, 1, 0]);
  const stage3Opacity = useTransform(smoothProgress, [0.58, 0.65, 0.75, 0.78], [0, 1, 1, 0]);
  const stage4Opacity = useTransform(smoothProgress, [0.78, 0.85, 0.92, 0.95], [0, 1, 1, 0]);
  const stage5Opacity = useTransform(smoothProgress, [0.92, 0.96, 1], [0, 1, 1]);

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

  const scrollToMarketplace = () => {
    const target = document.getElementById('marketplace-feeds');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const stats = [
    { label: 'Active Listings', value: formatNumber(50000), icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Verified Sellers', value: formatNumber(12000), icon: Shield, color: 'text-emerald-500' },
    { label: 'Cities Covered', value: '20+', icon: MapPin, color: 'text-purple-500' },
    { label: 'Daily Transactions', value: formatNumber(5000), icon: Zap, color: 'text-amber-500' },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">

      {/* ── CINEMATIC 3D SCROLL STORY HERO ── */}
      <div ref={storyContainerRef} className="relative h-[420vh]">
        {/* Sticky Viewport Container */}
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-slate-950 flex items-center justify-center">

          {/* Procedural 3D Canvas Scene */}
          <Marketplace3DHero scrollProgress={rawProgress} />

          {/* Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950 pointer-events-none z-10" />

          {/* ── STAGE 0: Initial Hero ── */}
          <motion.div
            style={{ opacity: stage0Opacity }}
            className="relative z-20 max-w-5xl mx-auto px-4 text-center pointer-events-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs md:text-sm px-4 py-1.5 rounded-full mb-6 shadow-xl">
              <Sparkles size={15} className="text-amber-400 animate-pulse" />
              <span>Explore Pakistan's Next-Gen Classified Marketplace</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-none tracking-tight">
              Buy & Sell <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent">Anything</span>
              <br />Across Pakistan
            </h1>

            <p className="text-slate-300 text-sm md:text-xl mb-8 max-w-2xl mx-auto font-normal leading-relaxed">
              Connect with verified buyers and sellers nationwide. Scroll to experience category zones or search directly below.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-white/10 backdrop-blur-xl p-2.5 rounded-3xl border border-white/20 shadow-2xl">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search phones, cars, property..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm md:text-base font-medium shadow-inner"
                />
              </div>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="px-4 py-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-44"
              >
                <option value="">All Cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                type="submit"
                className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-blue-500 hover:from-primary-700 hover:to-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Search
              </button>
            </form>

            {/* Quick Trending Tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['iPhone 16', 'Toyota Yaris', 'Flat in Johar Town', 'Honda Civic', 'MacBook Pro'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/90 text-xs font-medium rounded-full border border-white/15 transition-all cursor-pointer backdrop-blur-xs"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Scroll Indicator */}
            <div className="mt-10 flex flex-col items-center gap-1.5 opacity-80 animate-bounce">
              <span className="text-[11px] font-semibold tracking-widest text-slate-300 uppercase">Scroll to Explore</span>
              <ChevronDown size={18} className="text-primary-400" />
            </div>
          </motion.div>

          {/* ── STAGE 1: Mobile & Tech ── */}
          <motion.div
            style={{ opacity: stage1Opacity }}
            className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-auto"
          >
            <div className="max-w-xl bg-slate-900/80 backdrop-blur-2xl border border-blue-500/30 p-8 rounded-3xl text-center shadow-2xl text-white">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <Smartphone size={28} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">Category Zone 01</span>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-1 mb-3">Mobile & Tech</h2>
              <p className="text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
                Smartphones, laptops, cameras, gaming consoles, and tech accessories with verified seller guarantees.
              </p>
              <button
                type="button"
                onClick={() => navigate('/listings?category=electronics-home-appliances')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer"
              >
                Explore Mobile & Tech <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>

          {/* ── STAGE 2: Vehicles ── */}
          <motion.div
            style={{ opacity: stage2Opacity }}
            className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-auto"
          >
            <div className="max-w-xl bg-slate-900/80 backdrop-blur-2xl border border-amber-500/30 p-8 rounded-3xl text-center shadow-2xl text-white">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                <Car size={28} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">Category Zone 02</span>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-1 mb-3">Vehicles</h2>
              <p className="text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
                Find your next ride. Browse luxury sedans, SUVs, motorbikes, commercial vehicles, and spare parts.
              </p>
              <button
                type="button"
                onClick={() => navigate('/listings?category=vehicles')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer"
              >
                Explore Vehicles <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>

          {/* ── STAGE 3: Property ── */}
          <motion.div
            style={{ opacity: stage3Opacity }}
            className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-auto"
          >
            <div className="max-w-xl bg-slate-900/80 backdrop-blur-2xl border border-emerald-500/30 p-8 rounded-3xl text-center shadow-2xl text-white">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <Building2 size={28} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Category Zone 03</span>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-1 mb-3">Property</h2>
              <p className="text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
                Buy, sell or rent residential houses, commercial plots, modern apartments, and portion floors nationwide.
              </p>
              <button
                type="button"
                onClick={() => navigate('/listings?category=property-for-sale')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer"
              >
                Explore Property <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>

          {/* ── STAGE 4: Jobs & Services ── */}
          <motion.div
            style={{ opacity: stage4Opacity }}
            className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-auto"
          >
            <div className="max-w-xl bg-slate-900/80 backdrop-blur-2xl border border-purple-500/30 p-8 rounded-3xl text-center shadow-2xl text-white">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                <Briefcase size={28} />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400">Category Zone 04</span>
              <h2 className="text-3xl md:text-5xl font-black text-white mt-1 mb-3">Jobs & Services</h2>
              <p className="text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
                Discover job opportunities, freelance services, home repairs, educational tutoring, and professional support.
              </p>
              <button
                type="button"
                onClick={() => navigate('/listings?category=jobs')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer"
              >
                Explore Jobs & Services <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>

          {/* ── STAGE 5: Final Reveal ── */}
          <motion.div
            style={{ opacity: stage5Opacity }}
            className="absolute inset-0 z-20 flex items-center justify-center p-6 text-center pointer-events-auto"
          >
            <div className="max-w-2xl text-white">
              <h2 className="text-4xl md:text-6xl font-black mb-4">
                Everything You Need.
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">One Marketplace.</span>
              </h2>
              <p className="text-slate-300 text-base md:text-lg mb-8 max-w-lg mx-auto">
                Explore thousands of active ads posted by real people across Pakistan today.
              </p>
              <button
                type="button"
                onClick={scrollToMarketplace}
                className="px-8 py-4 bg-gradient-to-r from-primary-600 to-amber-500 hover:from-primary-700 hover:to-amber-600 text-white font-black text-base rounded-2xl transition-all shadow-2xl cursor-pointer"
              >
                Start Exploring Feeds
              </button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── MAIN MARKETPLACE FEEDS SECTION ── */}
      <div id="marketplace-feeds" className="relative z-30">

        {/* Stats Section */}
        <section className="bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs shrink-0">
                    <stat.icon size={24} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none mb-1">{stat.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Browse Categories Grid */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Browse Categories</h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Find items quickly by exploring top marketplace categories</p>
            </div>
            <Link to="/listings" className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1.5">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3.5">
            {loadingCategories
              ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                  <Skeleton className="w-12 h-12 rounded-2xl mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))
              : categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={`/category/${cat.slug}`}
                    className="flex flex-col items-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 group cursor-pointer"
                  >
                    <div
                      className="w-13 h-13 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs"
                      style={{ backgroundColor: (cat.color || '#3b82f6') + '15' }}
                    >
                      <Icon name={cat.icon} size={24} style={{ color: cat.color || '#3b82f6' }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-center leading-tight">{cat.name}</span>
                  </Link>
                </motion.div>
              ))}
          </div>
        </section>

        {/* Featured Listings Carousel */}
        {(loadingFeatured || featuredListings.length > 0) && (
          <section className="max-w-7xl mx-auto px-4 py-8 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Star size={20} className="fill-amber-500" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Featured Listings</h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Hand-picked premium ads from top verified sellers</p>
                </div>
              </div>
              <Link to="/listings?featured=true" className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1.5">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {loadingFeatured
                ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card overflow-hidden rounded-2xl">
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

        {/* Category-wise Rows */}
        {loadingCategories
          ? Array.from({ length: 3 }).map((_, i) => (
            <section key={i} className="max-w-7xl mx-auto px-4 py-8 border-b border-slate-200/80 dark:border-slate-800">
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
                    <div className="card overflow-hidden rounded-2xl">
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

        {/* High-Impact Post Ad CTA Banner */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="relative rounded-3xl bg-gradient-to-r from-primary-700 via-primary-600 to-amber-600 p-8 md:p-14 overflow-hidden shadow-2xl text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative z-10 max-w-xl text-center md:text-left">
              <span className="text-xs font-black uppercase tracking-widest text-amber-300 bg-black/20 px-3 py-1 rounded-full border border-amber-300/30">
                Start Selling Today
              </span>
              <h2 className="text-3xl md:text-5xl font-black mt-3 mb-3 leading-tight">Got Something to Sell?</h2>
              <p className="text-primary-100 text-sm md:text-base leading-relaxed">
                Post your ad for free in under 2 minutes and reach thousands of interested buyers across Pakistan.
              </p>
            </div>
            <div className="relative z-10 shrink-0">
              <Link
                to={user ? '/dashboard/listings/new' : '/register'}
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-primary-700 font-black text-base rounded-2xl hover:bg-slate-100 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
              >
                Post Free Ad Now <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default HomePage;