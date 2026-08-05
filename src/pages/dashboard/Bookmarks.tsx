import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Skeleton, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { bookmarksService } from '../../services';
import { Bookmark } from '../../types';
import ListingCard from '../../components/listings/ListingCard';
import { Heart } from 'lucide-react';
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

export const BookmarksPage: React.FC = () => {
    const { user } = useAuth();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchBookmarks = () => {
            bookmarksService.getBookmarks(user.id)
                .then(setBookmarks)
                .finally(() => setLoading(false));
        };
        fetchBookmarks();

        const channel = supabase
            .channel(`user-bookmarks-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${user.id}` }, () => {
                fetchBookmarks();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    const handleRemove = async (listingId: string) => {
        if (!user) return;
        await bookmarksService.removeBookmark(user.id, listingId);
        setBookmarks(prev => prev.filter(b => b.listing_id !== listingId));
    };

    return (
        <DashboardLayout navItems={navItems} title="Saved Listings">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Saved Listings</h1>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{bookmarks.length} items</span>
                </div>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}
                    </div>
                ) : bookmarks.length === 0 ? (
                    <EmptyState
                        icon={<Heart size={28} />}
                        title="No saved listings"
                        description="Start browsing and save listings you're interested in"
                        action={<Link to="/listings" className="btn-primary">Browse Listings</Link>}
                    />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {bookmarks.map(b => b.listing && (
                            <ListingCard
                                key={b.id}
                                listing={b.listing}
                                isBookmarked={true}
                                onBookmarkChange={(id, bookmarked) => { if (!bookmarked) handleRemove(id); }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};