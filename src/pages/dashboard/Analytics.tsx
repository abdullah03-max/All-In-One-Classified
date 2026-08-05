import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Skeleton, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { listingsService } from '../../services/listingsService';
import { Listing } from '../../types';
import { formatPrice } from '../../utils/helpers';
import { Eye, TrendingUp, CheckCircle, Package, BarChart2 } from 'lucide-react';
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

export const AnalyticsPage: React.FC = () => {
    const { user } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchListings = () => {
            listingsService.getSellerListings(user.id).then(setListings).finally(() => setLoading(false));
        };
        fetchListings();

        const channel = supabase
            .channel(`seller-analytics-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'listings', filter: `seller_id=eq.${user.id}` }, () => {
                fetchListings();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    const totalViews = listings.reduce((s, l) => s + l.views_count, 0);
    const activeCount = listings.filter(l => l.status === 'active').length;
    const soldCount = listings.filter(l => l.status === 'sold').length;

    const topListings = [...listings].sort((a, b) => b.views_count - a.views_count).slice(0, 10);

    const viewsData = topListings.map(l => ({
        name: l.title.slice(0, 20),
        views: l.views_count,
        price: l.price,
    }));

    return (
        <DashboardLayout navItems={navItems} title="Analytics">
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Views" value={totalViews.toLocaleString()} icon={<Eye size={20} />} color="blue" />
                    <StatCard title="Active Listings" value={activeCount} icon={<TrendingUp size={20} />} color="green" />
                    <StatCard title="Sold Items" value={soldCount} icon={<CheckCircle size={20} />} color="purple" />
                    <StatCard title="Total Listings" value={listings.length} icon={<Package size={20} />} color="orange" />
                </div>

                <div className="card p-5">
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Top Performing Listings (by views)</h2>
                    {loading ? (
                        <Skeleton className="h-48" />
                    ) : viewsData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={viewsData}>
                                    <defs>
                                        <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#viewGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="mt-4 space-y-2">
                                {topListings.map((listing, i) => (
                                    <div key={listing.id} className="flex items-center gap-3">
                                        <span className="w-5 text-xs text-slate-400 font-mono">#{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <Link to={`/listings/${listing.id}`} className="text-xs font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 truncate">
                                                    {listing.title}
                                                </Link>
                                                <span className="text-xs text-slate-500 ml-2 shrink-0">{listing.views_count} views</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full"
                                                    style={{ width: `${topListings[0].views_count > 0 ? (listing.views_count / topListings[0].views_count) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <EmptyState icon={<BarChart2 size={24} />} title="No data yet" description="Analytics will appear as your listings get views" />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};