import React, { useState } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { Search, Smartphone, Car, Building2, Briefcase, Sparkles, ArrowRight, MapPin, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CITIES } from '../../utils/constants';

interface RealisticMarketplaceHeroProps {
  smoothProgress: MotionValue<number>;
  onSearch: (query: string, city: string) => void;
  onNavigateCategory: (slug: string) => void;
  onScrollToMarketplace: () => void;
}

export const RealisticMarketplaceHero: React.FC<RealisticMarketplaceHeroProps> = ({
  smoothProgress,
  onSearch,
  onNavigateCategory,
  onScrollToMarketplace,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery, selectedCity);
  };

  // Scroll Transforms for Scenes 1 to 6
  // Scene 1: Intro Overview (0.00 - 0.18)
  const scene1Opacity = useTransform(smoothProgress, [0, 0.12, 0.18], [1, 1, 0]);
  const scene1Y = useTransform(smoothProgress, [0, 0.18], [0, -40]);
  const scene1Scale = useTransform(smoothProgress, [0, 0.18], [1, 0.95]);

  // Scene 2: Tech (0.18 - 0.38)
  const scene2Opacity = useTransform(smoothProgress, [0.18, 0.24, 0.34, 0.38], [0, 1, 1, 0]);
  const scene2Scale = useTransform(smoothProgress, [0.18, 0.28, 0.38], [0.9, 1, 1.05]);
  const scene2Y = useTransform(smoothProgress, [0.18, 0.28, 0.38], [30, 0, -20]);

  // Scene 3: Vehicles (0.38 - 0.58)
  const scene3Opacity = useTransform(smoothProgress, [0.38, 0.44, 0.54, 0.58], [0, 1, 1, 0]);
  const scene3Scale = useTransform(smoothProgress, [0.38, 0.48, 0.58], [0.9, 1, 1.05]);
  const scene3Y = useTransform(smoothProgress, [0.38, 0.48, 0.58], [30, 0, -20]);

  // Scene 4: Property (0.58 - 0.78)
  const scene4Opacity = useTransform(smoothProgress, [0.58, 0.64, 0.74, 0.78], [0, 1, 1, 0]);
  const scene4Zoom = useTransform(smoothProgress, [0.58, 0.78], [1, 1.15]);
  const scene4Y = useTransform(smoothProgress, [0.58, 0.78], [30, 0]);

  // Scene 5: Jobs & Services (0.78 - 0.90)
  const scene5Opacity = useTransform(smoothProgress, [0.78, 0.83, 0.88, 0.92], [0, 1, 1, 0]);
  const scene5Y = useTransform(smoothProgress, [0.78, 0.85, 0.92], [30, 0, -20]);

  // Scene 6: Final Reveal (0.90 - 1.00)
  const scene6Opacity = useTransform(smoothProgress, [0.90, 0.95, 1], [0, 1, 1]);
  const scene6Scale = useTransform(smoothProgress, [0.90, 1], [0.92, 1]);

  // Product Showcase Images (High Resolution Realistic Unsplash Product Cutouts / Scenes)
  const techImg = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80"; // Smartphones & Accessories
  const laptopImg = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80"; // MacBook Tech
  const carImg = "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80"; // Luxury Modern Electric Car
  const houseExteriorImg = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"; // Modern Architectural Villa
  const houseInteriorImg = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80"; // Luxury Living Room
  const officeImg = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80"; // Executive Modern Office

  return (
    <div className="relative w-full h-full bg-slate-950 text-white select-none overflow-hidden font-sans">
      
      {/* Soft Warm Ambient Lighting Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-600/15 via-indigo-500/10 to-amber-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Subtle Background Mesh Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none opacity-70" />

      {/* ── SCENE 1: OUTSIDE / INTRO ── */}
      <motion.div
        style={{ opacity: scene1Opacity, y: scene1Y, scale: scene1Scale }}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 max-w-6xl mx-auto text-center pointer-events-auto"
      >
        {/* Subtle Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-slate-200 text-xs font-semibold mb-6 shadow-md backdrop-blur-md">
          <Sparkles size={14} className="text-amber-400" />
          <span>Pakistan's Marketplace</span>
        </div>

        {/* Elegant Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.08] mb-5">
          Everything you need.
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            All in one place.
          </span>
        </h1>

        {/* Supporting Subtitle */}
        <p className="text-slate-300 text-base md:text-xl font-normal max-w-2xl mb-8 leading-relaxed">
          Buy and sell products, vehicles, property, jobs and more from verified sellers nationwide.
        </p>

        {/* Integrated Clean Natural Search Bar */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col sm:flex-row gap-2"
        >
          <div className="flex-1 relative flex items-center">
            <Search size={18} className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for today?"
              className="w-full pl-10 pr-3 py-3 rounded-xl bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm md:text-base font-medium focus:outline-none"
            />
          </div>
          <div className="relative flex items-center border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-2">
            <MapPin size={16} className="absolute left-3 text-slate-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full sm:w-40 pl-9 pr-4 py-3 rounded-xl bg-transparent text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="text-slate-900">All Cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c} className="text-slate-900">{c}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-7 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Search
          </button>
        </form>

        {/* Hero Product Cards Layer Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 w-full max-w-4xl opacity-90">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">Phones & Tech</p>
              <p className="text-[11px] text-slate-400">12,400+ Ads</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Car size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">Vehicles</p>
              <p className="text-[11px] text-slate-400">8,500+ Cars</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">Property</p>
              <p className="text-[11px] text-slate-400">15,000+ Homes</p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Briefcase size={20} />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white">Jobs & Services</p>
              <p className="text-[11px] text-slate-400">4,200+ Offers</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-8 flex flex-col items-center gap-1 opacity-70 animate-bounce">
          <span className="text-[11px] font-medium tracking-widest text-slate-400 uppercase">Scroll to Experience</span>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </motion.div>

      {/* ── SCENE 2: MOBILE & TECH ── */}
      <motion.div
        style={{ opacity: scene2Opacity, scale: scene2Scale, y: scene2Y }}
        className="absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-auto"
      >
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-6 md:p-10 rounded-3xl shadow-2xl">
          {/* Left Text */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mb-4">
              <Smartphone size={14} /> Technology Showroom
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-3">Mobile & Tech</h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
              Everything tech, all in one place. Discover flagship smartphones, laptops, cameras, audio gear, and accessories from top verified sellers.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg"><CheckCircle2 size={12} className="text-emerald-400" /> PTA Approved</span>
              <span className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg"><ShieldCheck size={12} className="text-blue-400" /> Buyer Protection</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateCategory('electronics-home-appliances')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer"
            >
              Explore Tech Listings <ArrowRight size={16} />
            </button>
          </div>
          {/* Right Product Image Composite */}
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group">
            <img
              src={techImg}
              alt="Mobile and Tech Showcase"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl">
                <p className="text-xs font-bold text-white">iPhone 16 Pro Max</p>
                <p className="text-[11px] text-blue-400 font-bold">PKR 445,000</p>
              </div>
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl hidden sm:block">
                <p className="text-xs font-bold text-white">M3 MacBook Pro</p>
                <p className="text-[11px] text-emerald-400 font-bold">Verified Seller</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── SCENE 3: VEHICLES ── */}
      <motion.div
        style={{ opacity: scene3Opacity, scale: scene3Scale, y: scene3Y }}
        className="absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-auto"
      >
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-6 md:p-10 rounded-3xl shadow-2xl">
          {/* Left Product Image Composite */}
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 order-2 lg:order-1 group">
            <img
              src={carImg}
              alt="Vehicles Showcase"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl">
              <p className="text-xs font-bold text-white">Toyota Yaris 2024</p>
              <p className="text-[11px] text-amber-400 font-bold">PKR 4,850,000 • Lahore</p>
            </div>
          </div>
          {/* Right Text */}
          <div className="text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-4">
              <Car size={14} /> Automotive Showroom
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-3">Find Your Next Ride</h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
              Cars, bikes and vehicles from verified individual owners and top dealerships across Pakistan.
            </p>
            <button
              type="button"
              onClick={() => onNavigateCategory('vehicles')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer"
            >
              Explore Vehicles <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── SCENE 4: PROPERTY (REAL ESTATE INTERIOR ZOOM) ── */}
      <motion.div
        style={{ opacity: scene4Opacity, y: scene4Y }}
        className="absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-auto"
      >
        <div className="max-w-5xl w-full bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-6 md:p-10 rounded-3xl shadow-2xl text-left">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-2">
                <Building2 size={14} /> Real Estate & Homes
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white">Find Your Next Place</h2>
              <p className="text-slate-300 text-sm">Buy or rent houses, apartments, and plots across Pakistan.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateCategory('property-for-sale')}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer shrink-0"
            >
              Explore Property <ArrowRight size={16} />
            </button>
          </div>

          {/* Layered Exterior to Interior Zoom Effect */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              style={{ scale: scene4Zoom }}
              className="relative h-48 md:h-60 rounded-2xl overflow-hidden border border-slate-800 shadow-xl group"
            >
              <img
                src={houseExteriorImg}
                alt="House Exterior"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-xl">
                <p className="text-xs font-bold text-white">1 Kanal Luxury Villa</p>
                <p className="text-[11px] text-emerald-400 font-bold">DHA Phase 6, Lahore</p>
              </div>
            </motion.div>
            <motion.div
              style={{ scale: scene4Zoom }}
              className="relative h-48 md:h-60 rounded-2xl overflow-hidden border border-slate-800 shadow-xl group hidden md:block"
            >
              <img
                src={houseInteriorImg}
                alt="House Interior Living Room"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-xl">
                <p className="text-xs font-bold text-white">Furnished Interior</p>
                <p className="text-[11px] text-blue-400 font-bold">Available for Rent</p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── SCENE 5: JOBS & SERVICES ── */}
      <motion.div
        style={{ opacity: scene5Opacity, y: scene5Y }}
        className="absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-auto"
      >
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-6 md:p-10 rounded-3xl shadow-2xl">
          {/* Left Text */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 mb-4">
              <Briefcase size={14} /> Professional Careers & Services
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-3">Opportunities Are Everywhere</h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
              Connect with top employers hiring nationwide or hire verified local service professionals for your home & business.
            </p>
            <button
              type="button"
              onClick={() => onNavigateCategory('jobs')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer"
            >
              Explore Jobs & Services <ArrowRight size={16} />
            </button>
          </div>
          {/* Right Image */}
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group">
            <img
              src={officeImg}
              alt="Office Workspace"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl">
              <p className="text-xs font-bold text-white">Software Engineer & Design Openings</p>
              <p className="text-[11px] text-purple-300 font-bold">Full Time & Remote Options</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── SCENE 6: FINAL REVEAL ── */}
      <motion.div
        style={{ opacity: scene6Opacity, scale: scene6Scale }}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center pointer-events-auto"
      >
        <div className="max-w-2xl text-white">
          <h2 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight leading-tight">
            Everything You Need.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent">
              One Marketplace.
            </span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg mb-8 max-w-lg mx-auto leading-relaxed font-normal">
            Join thousands of buyers and sellers across Pakistan. Start browsing listings or post your free ad today.
          </p>
          <button
            type="button"
            onClick={onScrollToMarketplace}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-bold text-base rounded-2xl transition-all shadow-2xl cursor-pointer hover:scale-105 active:scale-95"
          >
            Explore Marketplace Feeds
          </button>
        </div>
      </motion.div>

    </div>
  );
};
