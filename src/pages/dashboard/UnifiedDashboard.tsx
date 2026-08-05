import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Plus, Eye, Edit2, Trash2, TrendingUp, Package, MessageCircle,
    DollarSign, CheckCircle, XCircle, Clock, ChevronRight, BarChart2,
    Heart, Tag, Settings, LayoutDashboard, Search
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Badge, Button, Skeleton, EmptyState, ConfirmDialog, Avatar } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { listingsService } from '../../services/listingsService';
import { offersService } from '../../services';
import { chatService } from '../../services/chatService';
import { bookmarksService } from '../../services';
import { Listing, Offer, Conversation, Bookmark } from '../../types';
import { formatPrice, formatDate, cn } from '../../utils/helpers';
import ListingCard from '../../components/listings/ListingCard';
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

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
    active: { label: 'Active', variant: 'success' },
    pending: { label: 'Pending Review', variant: 'warning' },
    rejected: { label: 'Rejected', variant: 'error' },
    sold: { label: 'Sold', variant: 'info' },
    draft: { label: 'Draft', variant: 'default' },
    expired: { label: 'Expired', variant: 'default' },
    suspended: { label: 'Suspended', variant: 'error' },
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

    // Stats
    const activeListings = listings.filter(l => l.status === 'active').length;
    const pendingListings = listings.filter(l => l.status === 'pending').length;
    const totalViews = listings.reduce((sum, l) => sum + l.views_count, 0);
    const pendingOffers = offers.filter(o => o.status === 'pending' && o.seller_id === user?.id).length;
    const unreadMessages = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    const bookmarkCount = bookmarks.length;

    // Chart data
    const chartData = listings.slice(0, 7).map(l => ({
        name: l.title.slice(0, 15) + '...',
        views: l.views_count,
    }));

    if (dashboardError) {
        return (
            <DashboardLayout navItems={navItems} title="Dashboard">
                <div className="card p-8 text-center">
                    <p className="text-sm text-red-500">{dashboardError}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout navItems={navItems} title="Dashboard">
            <div className="space-y-6">
                {/* Welcome Section - Removed Avatar/Profile Icon */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            Welcome back, {user?.full_name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Manage your listings, track performance, and stay connected with buyers
                        </p>
                    </div>
                    <Link to="/dashboard/listings/new">
                        <Button icon={<Plus size={16} />}>Post New Ad</Button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Listings" value={listings.length} icon={<Package size={20} />} color="blue" />
                    <StatCard title="Active Listings" value={activeListings} icon={<CheckCircle size={20} />} color="green" />
                    <StatCard title="Total Views" value={totalViews.toLocaleString()} icon={<Eye size={20} />} color="purple" />
                    <StatCard title="Saved Listings" value={bookmarkCount} icon={<Heart size={20} />} color="red" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Pending Offers" value={pendingOffers} icon={<DollarSign size={20} />} color="orange" />
                    <StatCard title="Conversations" value={conversations.length} icon={<MessageCircle size={20} />} color="blue" />
                    <StatCard title="Unread Messages" value={unreadMessages} icon={<MessageCircle size={20} />} color="purple" />
                    <StatCard title="Total Offers" value={offers.length} icon={<Tag size={20} />} color="green" />
                </div>

                {/* Alerts */}
                {pendingListings > 0 && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                        <Clock size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                            You have <strong>{pendingListings}</strong> listing{pendingListings > 1 ? 's' : ''} waiting for review.
                        </p>
                        <Link to="/dashboard/listings" className="ml-auto text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium shrink-0">
                            View
                        </Link>
                    </div>
                )}

                {/* Chart - Views by Listing */}
                {chartData.length > 0 && (
                    <div className="card p-5">
                        <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <BarChart2 size={18} className="text-primary-500" /> Views by Listing
                        </h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#viewsGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Recent Listings */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Package size={18} className="text-primary-500" /> Recent Listings
                        </h2>
                        <Link to="/dashboard/listings" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
                    ) : listings.length === 0 ? (
                        <EmptyState
                            icon={<Package size={24} />}
                            title="No listings yet"
                            description="Create your first listing to start selling"
                            action={<Link to="/dashboard/listings/new" className="btn-primary text-sm">Post Free Ad</Link>}
                        />
                    ) : (
                        <div className="space-y-2">
                            {listings.slice(0, 5).map(listing => (
                                <div key={listing.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                    {listing.images?.[0] ? (
                                        <img src={listing.images[0]} alt="" className="w-12 h-10 object-cover rounded-xl" />
                                    ) : (
                                        <div className="w-12 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/listings/${listing.id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 truncate block">
                                            {listing.title}
                                        </Link>
                                        <div className="flex items-center gap-2 mt-0.5">
                                             {(() => {
                                                 const isService = listing.category_id === 'c1000000-0000-0000-0000-000000000007' ||
                                                     listing.category?.slug === 'services' ||
                                                     (listing.category?.name && /services/i.test(listing.category.name)) ||
                                                     Boolean(listing.subcategory_id?.startsWith('d1000000-0000-0000-0000-000000000d')) ||
                                                     Boolean(listing.subcategory_id?.startsWith('d1000000-0000-0000-0000-000000000e')) ||
                                                     Boolean(listing.category_id?.startsWith('d1000000-0000-0000-0000-000000000d')) ||
                                                     Boolean(listing.category_id?.startsWith('d1000000-0000-0000-0000-000000000e'));

                                                 const isJob = listing.category_id === 'c1000000-0000-0000-0000-000000000004' ||
                                                     listing.category?.slug === 'jobs' ||
                                                     (listing.category?.name && /jobs/i.test(listing.category.name)) ||
                                                     Boolean(listing.subcategory_id?.startsWith('d1000000-0000-0000-0000-000000004')) ||
                                                     Boolean(listing.category_id?.startsWith('d1000000-0000-0000-0000-000000004')) ||
                                                     Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000119')) ||
                                                     Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000120')) ||
                                                     Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000121')) ||
                                                     Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000122')) ||
                                                     Boolean(listing.subcategory_id?.startsWith('c1000000-0000-0000-0000-000000000123'));

                                                 return !isService && !isJob ? (
                                                     <span className="text-xs text-primary-600 font-semibold">{formatPrice(listing.price)}</span>
                                                 ) : null;
                                             })()}
                                            <span className="text-xs text-slate-400 flex items-center gap-1"><Eye size={10} /> {listing.views_count}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant={statusConfig[listing.status]?.variant || 'default'}>
                                            {statusConfig[listing.status]?.label || listing.status}
                                        </Badge>
                                        <Link to={`/dashboard/listings/${listing.id}/edit`} className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <Edit2 size={14} />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Two Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pending Offers */}
                    {pendingOffers > 0 && (
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    <DollarSign size={18} className="text-green-500" /> Pending Offers
                                </h2>
                                <Link to="/dashboard/offers" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                                    View all <ChevronRight size={14} />
                                </Link>
                            </div>
                            <div className="space-y-2">
                                {offers.filter(o => o.status === 'pending' && o.seller_id === user?.id).slice(0, 3).map(offer => (
                                    <div key={offer.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-xl">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{offer.listing?.title}</p>
                                            <p className="text-xs text-slate-500">
                                                Offer: <span className="font-bold text-green-600">{formatPrice(offer.amount)}</span>
                                                {offer.listing?.price && ` (Listed: ${formatPrice(offer.listing.price)})`}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    await offersService.updateOfferStatus(offer.id, 'accepted');
                                                    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'accepted' } : o));
                                                    toast.success('Offer accepted!');
                                                }}
                                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-xl transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await offersService.updateOfferStatus(offer.id, 'rejected');
                                                    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, status: 'rejected' } : o));
                                                    toast.success('Offer declined');
                                                }}
                                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400 hover:text-red-600 text-xs font-medium rounded-xl transition-colors"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Conversations */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <MessageCircle size={18} className="text-blue-500" /> Recent Messages
                            </h2>
                            <Link to="/chat" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                                View all <ChevronRight size={14} />
                            </Link>
                        </div>
                        {conversations.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No messages yet</p>
                        ) : (
                            <div className="space-y-2">
                                {conversations.slice(0, 4).map(conv => {
                                    const other = user?.id === conv.buyer_id ? conv.seller : conv.buyer;
                                    return (
                                        <Link
                                            key={conv.id}
                                            to={`/chat?conv=${conv.id}`}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Avatar src={other?.avatar_url} name={other?.full_name || ''} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{other?.full_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    {conv.listing?.title}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {conv.last_message && (
                                                    <p className="text-xs text-slate-400">{formatDate(conv.last_message.created_at)}</p>
                                                )}
                                                {(conv.unread_count || 0) > 0 && (
                                                    <span className="inline-block mt-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                                        {conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Saved Listings */}
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Heart size={18} className="text-red-500" /> Saved Listings
                        </h2>
                        <Link to="/dashboard/bookmarks" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
                        </div>
                    ) : bookmarks.length === 0 ? (
                        <EmptyState
                            icon={<Heart size={24} />}
                            title="No saved listings"
                            description="Browse listings and save the ones you're interested in"
                            action={<Link to="/listings" className="btn-primary text-sm">Browse Listings</Link>}
                        />
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {bookmarks.slice(0, 4).map(b => b.listing && (
                                <ListingCard key={b.id} listing={b.listing} isBookmarked={true} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UnifiedDashboard;