import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Eye, Edit2, Trash2, Package, Clock, CheckCircle, AlertOctagon, AlertTriangle, Sparkles } from 'lucide-react';
import { PromoteListingModal } from '../../components/listings/PromoteListingModal';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Button, Skeleton, EmptyState, ConfirmDialog } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { listingsService } from '../../services/listingsService';
import { Listing } from '../../types';
import { formatPrice, formatDate, cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

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
    changes_requested: { label: 'Changes Requested', variant: 'warning' },
};

export const MyListingsPage: React.FC = () => {
    const { user } = useAuth();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [filter, setFilter] = useState('all');
    const [selectedPromoteListing, setSelectedPromoteListing] = useState<Listing | null>(null);

    useEffect(() => {
        if (!user) return;
        
        const fetchListings = () => {
            listingsService.getSellerListings(user.id)
                .then(setListings)
                .finally(() => setLoading(false));
        };
        fetchListings();

        const channel = supabase
            .channel(`seller-listings-${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'listings',
                filter: `seller_id=eq.${user.id}`
            }, () => {
                fetchListings();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    const filtered = filter === 'all' ? listings : listings.filter(l => l.status === filter);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await listingsService.deleteListing(deleteId);
            setListings(prev => prev.filter(l => l.id !== deleteId));
            toast.success('Listing deleted');
        } catch {
            toast.error('Failed to delete listing');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const handleMarkSold = async (id: string) => {
        await listingsService.updateListing(id, { status: 'sold' });
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'sold' } : l));
        toast.success('Listing marked as sold');
    };

    return (
        <DashboardLayout navItems={navItems} title="My Listings">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Listings</h1>
                    <Link to="/dashboard/listings/new">
                        <Button icon={<Plus size={16} />}>Post New Ad</Button>
                    </Link>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 overflow-x-auto scrollbar-hide">
                    {['all', 'active', 'pending', 'changes_requested', 'suspended', 'rejected', 'sold', 'expired'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                                filter === s
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            )}
                        >
                            {statusConfig[s]?.label || s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            <span className="ml-1.5 text-xs text-slate-400">
                                ({s === 'all' ? listings.length : listings.filter(l => l.status === s).length})
                            </span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={<Package size={28} />}
                        title={filter === 'all' ? 'No listings yet' : `No ${filter} listings`}
                        description={filter === 'all' ? 'Create your first listing to start selling' : `You don't have any ${filter} listings`}
                        action={filter === 'all' ? <Link to="/dashboard/listings/new" className="btn-primary">Post First Ad</Link> : undefined}
                    />
                ) : (
                    <div className="space-y-3">
                        {filtered.map(listing => (
                            <motion.div
                                key={listing.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                            >
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                    <div className="w-16 h-12 sm:w-20 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                                        {listing.images?.[0] ? (
                                            <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={`/listings/${listing.id}`}
                                            className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 line-clamp-1"
                                        >
                                            {listing.title}
                                        </Link>
                                        {listing.category && (
                                            <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
                                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded text-slate-600 dark:text-slate-400 font-medium">
                                                    {listing.category.name}
                                                </span>
                                                {listing.attributes?.subcategory_name && (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-700">/</span>
                                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded text-slate-600 dark:text-slate-400 font-medium">
                                                            {listing.attributes.subcategory_name}
                                                        </span>
                                                    </>
                                                )}
                                                {listing.attributes?.sub_subcategory_name && (
                                                    <>
                                                        <span className="text-slate-300 dark:text-slate-700">/</span>
                                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded text-slate-600 dark:text-slate-400 font-medium">
                                                            {listing.attributes.sub_subcategory_name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
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
                                                    <span className="text-sm font-bold text-primary-600">{formatPrice(listing.price)}</span>
                                                ) : null;
                                            })()}
                                            <span className="text-xs text-slate-400 flex items-center gap-1"><Eye size={11} /> {listing.views_count}</span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} /> {formatDate(listing.created_at)}</span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            <Badge variant={statusConfig[listing.status]?.variant || 'default'}>
                                                {statusConfig[listing.status]?.label || listing.status}
                                            </Badge>
                                            {listing.is_featured && <span className="badge bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400">⭐ Featured</span>}
                                        </div>
                                        {listing.status === 'suspended' && (
                                            <div className="mt-2.5 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-xs text-red-700 dark:text-red-400 leading-relaxed w-full">
                                                <div className="font-semibold flex items-center gap-1.5 mb-1 text-red-800 dark:text-red-300">
                                                    <AlertOctagon size={14} className="animate-pulse" />
                                                    <span>Listing Suspended by Moderator</span>
                                                </div>
                                                <p className="mb-2"><strong>Reason:</strong> {listing.attributes?.suspension_reason || 'Violated content safety policy.'}</p>
                                                <div className="flex gap-2">
                                                    <Link
                                                        to={`/dashboard/listings/${listing.id}/edit`}
                                                        className="px-3 py-1 bg-red-650 hover:bg-red-700 text-white rounded font-medium hover:no-underline transition-all inline-flex items-center gap-1"
                                                    >
                                                        <Edit2 size={11} /> Edit & Resubmit
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                        {listing.status === 'changes_requested' && (
                                            <div className="mt-2.5 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-relaxed w-full">
                                                <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-300">
                                                    <AlertTriangle size={14} className="animate-pulse" />
                                                    <span>Changes Requested by Moderator</span>
                                                </div>
                                                <p className="mb-2"><strong>Required Changes:</strong> {listing.attributes?.changes_reason || 'Please review listing details.'}</p>
                                                <div className="flex gap-2">
                                                    <Link
                                                        to={`/dashboard/listings/${listing.id}/edit`}
                                                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium hover:no-underline transition-all inline-flex items-center gap-1"
                                                    >
                                                        <Edit2 size={11} /> Update & Resubmit
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800/60">
                                    <button
                                        onClick={() => setSelectedPromoteListing(listing)}
                                        className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                        title="Promote / Feature this ad"
                                    >
                                        <Sparkles size={13} className="text-amber-200 animate-pulse" />
                                        <span>Promote</span>
                                    </button>

                                    {listing.status === 'active' && (
                                        <button
                                            onClick={() => handleMarkSold(listing.id)}
                                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors flex items-center gap-1"
                                            title="Mark as sold"
                                        >
                                            <CheckCircle size={16} />
                                            <span className="sm:hidden font-medium">Mark Sold</span>
                                        </button>
                                    )}
                                    <Link
                                        to={`/dashboard/listings/${listing.id}/edit`}
                                        className="p-2 text-slate-400 hover:text-primary-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                        title="Edit ad"
                                    >
                                        <Edit2 size={16} />
                                        <span className="sm:hidden font-medium text-slate-500">Edit</span>
                                    </Link>
                                    <button
                                        onClick={() => setDeleteId(listing.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
                                        title="Delete ad"
                                    >
                                        <Trash2 size={16} />
                                        <span className="sm:hidden font-medium text-slate-500">Delete</span>
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Listing"
                message="Are you sure you want to delete this listing? This action cannot be undone."
                confirmText="Delete"
                loading={deleting}
            />

            {selectedPromoteListing && (
                <PromoteListingModal
                    isOpen={!!selectedPromoteListing}
                    onClose={() => setSelectedPromoteListing(null)}
                    listing={selectedPromoteListing}
                    onSuccess={() => {
                        if (user) {
                            listingsService.getSellerListings(user.id).then(setListings);
                        }
                    }}
                />
            )}
        </DashboardLayout>
    );
};