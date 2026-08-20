import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  TrendingUp,
  Package,
  MessageCircle,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  BarChart2,
  Heart,
  Tag,
  Settings,
  LayoutDashboard,
  Search,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  ExternalLink,
  Flame,
  AlertCircle
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Button, Skeleton, EmptyState, Avatar } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { listingsService } from '../../services/listingsService';
import { offersService } from '../../services';
import { chatService } from '../../services/chatService';
import { bookmarksService } from '../../services';
import { Listing, Offer, Conversation, Bookmark } from '../../types';
import { formatPrice, formatDate, cn } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

const navItems = [
  { label: 'Overview', icon: 'LayoutDashboard', to: '/dashboard' },
  { label: 'My Listings', icon: 'Package', to: '/dashboard/listings' },
  { label: 'Post New Ad', icon: 'Plus', to: '/dashboard/listings/new' },
  { label: 'Saved Listings', icon: 'Heart', to: '/dashboard/bookmarks' },
  { label: 'Offers', icon: 'DollarSign', to: '/dashboard/offers' },
  { label: 'Messages', icon: 'MessageCircle', to: '/chat' },
  { label: 'Analytics', icon: 'BarChart2', to: '/dashboard/analytics' },
  { label: 'Settings', icon: 'Settings', to: '/profile' },
];

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default'; bg: string; text: string }> = {
  active: { label: 'Active', variant: 'success', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  pending: { label: 'Pending Review', variant: 'warning', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  rejected: { label: 'Rejected', variant: 'error', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-600 dark:text-red-400' },
  sold: { label: 'Sold', variant: 'info', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  draft: { label: 'Draft', variant: 'default', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-600 dark:text-slate-400' },
  expired: { label: 'Expired', variant: 'default', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-600 dark:text-slate-400' },
  suspended: { label: 'Suspended', variant: 'error', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-600 dark:text-red-400' },
};

const UnifiedDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      try {
        const [l, c, o, b] = await Promise.all([
          listingsService.getSellerListings(user.id),
          chatService.getConversations(user.id),
          offersService.getOffers(user.id),
          bookmarksService.getBookmarks(user.id),
        ]);
        setListings(l);
        setConversations(c);
        setOffers(o);
        setBookmarks(b);
      } catch (error) {
        console.error('Dashboard load error:', error);
        setDashboardError('Unable to load dashboard. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    // Subscribe to listings changes
    const listingsChannel = supabase
      .channel(`dashboard-listings-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings', filter: `seller_id=eq.${user.id}` }, () => {
        listingsService.getSellerListings(user.id).then(setListings).catch(console.error);
      })
      .subscribe();

    // Subscribe to offers changes
    const offersChannel = supabase
      .channel(`dashboard-offers-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        offersService.getOffers(user.id).then(setOffers).catch(console.error);
      })
      .subscribe();

    // Subscribe to conversations changes
    const conversationsChannel = supabase
      .channel(`dashboard-conversations-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        chatService.getConversations(user.id).then(setConversations).catch(console.error);
      })
      .subscribe();

    // Subscribe to bookmarks changes
    const bookmarksChannel = supabase
      .channel(`dashboard-bookmarks-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${user.id}` }, () => {
        bookmarksService.getBookmarks(user.id).then(setBookmarks).catch(console.error);
      })
      .subscribe();

    return () => {
      listingsChannel.unsubscribe();
      offersChannel.unsubscribe();
      conversationsChannel.unsubscribe();
      bookmarksChannel.unsubscribe();
    };
  }, [user]);

  // Statistics Calculation
  const activeListings = listings.filter(l => l.status === 'active').length;
  const pendingListings = listings.filter(l => l.status === 'pending').length;
  const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const pendingOffers = offers.filter(o => o.status === 'pending' && o.seller_id === user?.id).length;
  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const bookmarkCount = bookmarks.length;

  // Chart data
  const chartData = listings.slice(0, 7).map(l => ({
    name: l.title.length > 14 ? l.title.slice(0, 14) + '...' : l.title,
    views: l.views_count || 0,
  }));

  if (dashboardError) {
    return (
      <DashboardLayout navItems={navItems} title="Dashboard">
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/40">
          <AlertCircle size={36} className="mx-auto text-red-500 mb-2" />
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{dashboardError}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Dashboard Overview">
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ── 1. MODERN HERO GREETING BANNER ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 text-white p-6 sm:p-8 shadow-xl shadow-primary-600/15">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar src={user?.avatar_url} name={user?.full_name} size="lg" className="ring-4 ring-white/20 shadow-xl" />
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-primary-700 rounded-full" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Welcome back, {user?.full_name?.split(' ')[0]}! 👋
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                    <ShieldCheck size={13} className="text-emerald-300" /> Verified Seller
                  </span>
                </div>
                <p className="text-primary-100 text-xs sm:text-sm mt-1 max-w-xl font-normal">
                  Manage your active ads, respond to negotiable buyer offers, and track your daily views.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <Link
                to="/dashboard/listings/new"
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-primary-700 hover:bg-slate-50 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={16} className="stroke-[3]" />
                <span>Post Free Ad</span>
              </Link>

              <Link
                to="/profile"
                className="inline-flex items-center justify-center p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl backdrop-blur-md transition-all"
                title="Edit Profile"
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. PENDING REVIEW ALERT NOTIFICATION ── */}
        {pendingListings > 0 && (
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold">
                  {pendingListings} listing{pendingListings > 1 ? 's are' : ' is'} currently in moderation queue
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                  Our team reviews all ads within 5–15 minutes.
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/listings"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors shrink-0"
            >
              View Listings
            </Link>
          </div>
        )}

        {/* ── 3. FOUR MODERN STATS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Listings */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Listings</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Package size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{listings.length}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {activeListings} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {pendingListings} pending moderation review
            </p>
          </div>

          {/* Total Ad Views */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Ad Views</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Eye size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{totalViews.toLocaleString()}</span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center">
                <TrendingUp size={12} className="mr-0.5" /> High reach
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {listings.length > 0 ? `Avg ${Math.round(totalViews / listings.length)} views per ad` : 'No ads posted yet'}
            </p>
          </div>

          {/* Messages & Conversations */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Buyer Chats</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{conversations.length}</span>
              {unreadMessages > 0 ? (
                <span className="text-xs font-bold text-red-500 animate-pulse">
                  {unreadMessages} Unread
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-600">All caught up</span>
              )}
            </div>
            <Link to="/chat" className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline mt-1 inline-block font-semibold">
              Open SafeChat inbox →
            </Link>
          </div>

          {/* Pending Offers */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Offers & Deals</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">{offers.length}</span>
              {pendingOffers > 0 ? (
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {pendingOffers} Pending
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400">0 Pending</span>
              )}
            </div>
            <Link to="/dashboard/offers" className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline mt-1 inline-block font-semibold">
              Manage offers →
            </Link>
          </div>
        </div>

        {/* ── 4. MAIN 2-COLUMN SECTION: CHART + RECENT LISTINGS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2/3): Views Chart & Recent Listings */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Ad Views Area Chart */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart2 size={18} className="text-primary-500" /> Ad Views Performance
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Top listings view traffic</p>
                </div>
                <Link
                  to="/dashboard/analytics"
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                >
                  Full Analytics <ChevronRight size={13} />
                </Link>
              </div>

              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderColor: '#334155',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                      }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fill="url(#viewsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-center p-6">
                  <BarChart2 size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">No view statistics yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Post an ad to start tracking your views!</p>
                </div>
              )}
            </div>

            {/* Recent Listings Table */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Package size={18} className="text-primary-500" /> Recent Classified Ads
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Your most recent active and pending listings</p>
                </div>
                <Link
                  to="/dashboard/listings"
                  className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                >
                  View All ({listings.length}) <ChevronRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-2xl" />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="p-8 text-center">
                  <Package size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No ads posted yet</h4>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Post your first item for free to start getting buyer leads.</p>
                  <Link
                    to="/dashboard/listings/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/25"
                  >
                    <Plus size={14} /> Post Free Ad
                  </Link>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {listings.slice(0, 6).map(listing => {
                    const status = statusConfig[listing.status] || statusConfig.active;
                    const isServiceOrJob =
                      listing.category?.slug === 'services' ||
                      listing.category?.slug === 'jobs' ||
                      listing.category_id === 'c1000000-0000-0000-0000-000000000007' ||
                      listing.category_id === 'c1000000-0000-0000-0000-000000000004';

                    return (
                      <div
                        key={listing.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700/50 transition-all group"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Package size={18} />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/listings/${listing.id}`}
                            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 truncate block"
                          >
                            {listing.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {!isServiceOrJob && (
                              <span className="text-xs font-black text-primary-600 dark:text-primary-400">
                                {formatPrice(listing.price)}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Eye size={11} /> {listing.views_count || 0} views
                            </span>
                            <span className="text-[11px] text-slate-400">• {listing.city}</span>
                          </div>
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-extrabold border", status.bg, status.text)}>
                            {status.label}
                          </span>

                          <Link
                            to={`/dashboard/listings/${listing.id}/edit`}
                            className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            title="Edit Listing"
                          >
                            <Edit2 size={14} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (1/3): Quick Actions, Offers & Pro Tips */}
          <div className="space-y-6">
            
            {/* Quick Action Shortcuts */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" /> Marketplace Shortcuts
              </h3>

              <div className="space-y-2.5">
                <Link
                  to="/dashboard/verification"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 hover:scale-[1.01] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Account Verification</p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Get Verified Seller Badge</p>
                  </div>
                  <ChevronRight size={15} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/dashboard/bookmarks"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 hover:scale-[1.01] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Heart size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-rose-950 dark:text-rose-200">Saved Ads Wishlist</p>
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">{bookmarkCount} items saved</p>
                  </div>
                  <ChevronRight size={15} className="text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/help"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 hover:scale-[1.01] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <TrendingUp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-950 dark:text-blue-200">Help Center & FAQ</p>
                    <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80">Posting & Safety guides</p>
                  </div>
                  <ChevronRight size={15} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Pending Offers Widget */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-500" /> Recent Buyer Offers
                </h3>
                <Link to="/dashboard/offers" className="text-xs text-primary-600 font-bold hover:underline">
                  All
                </Link>
              </div>

              {offers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No offers received yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {offers.slice(0, 4).map(offer => (
                    <div
                      key={offer.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {offer.buyer?.full_name || 'Buyer'}
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {formatPrice(offer.amount)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {offer.listing?.title || 'Listing item'}
                      </p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>{formatDate(offer.created_at)}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full font-bold capitalize",
                          offer.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                          offer.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600' :
                          'bg-slate-500/10 text-slate-500'
                        )}>
                          {offer.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pro Seller Tip */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                <Flame size={16} />
                <span className="text-xs font-black uppercase tracking-wider">Pro Seller Tip</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                Listings with clear product videos and 3+ high-resolution photos receive <strong>4x more inquiries</strong> on All In One!
              </p>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default UnifiedDashboard;