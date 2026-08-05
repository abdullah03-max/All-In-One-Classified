import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Clock, CheckCircle, XCircle, Tag } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Badge, Skeleton, EmptyState } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { offersService } from '../../services';
import { Offer } from '../../types';
import { formatPrice, formatDate } from '../../utils/helpers';
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

export const OffersPage: React.FC = () => {
    const { user } = useAuth();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchOffers = () => {
            offersService.getOffers(user.id).then(setOffers).finally(() => setLoading(false));
        };
        fetchOffers();

        const channel = supabase
            .channel(`user-offers-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
                fetchOffers();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    const handleWithdraw = async (id: string) => {
        await offersService.updateOfferStatus(id, 'withdrawn');
        setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'withdrawn' } : o));
        toast.success('Offer withdrawn');
    };

    const handleAccept = async (id: string) => {
        await offersService.updateOfferStatus(id, 'accepted');
        setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'accepted' } : o));
        toast.success('Offer accepted!');
    };

    const handleDecline = async (id: string) => {
        await offersService.updateOfferStatus(id, 'rejected');
        setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'rejected' } : o));
        toast.success('Offer declined');
    };

    // Separate offers into received and sent
    const receivedOffers = offers.filter(o => o.seller_id === user?.id);
    const sentOffers = offers.filter(o => o.buyer_id === user?.id);

    return (
        <DashboardLayout navItems={navItems} title="Offers">
            <div className="space-y-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Offers</h1>

                {/* Received Offers (as Seller) */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Tag size={18} className="text-green-500" /> Offers Received
                    </h2>
                    {loading ? (
                        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
                    ) : receivedOffers.length === 0 ? (
                        <EmptyState icon={<DollarSign size={24} />} title="No offers received" description="Buyers haven't made any offers on your listings yet" />
                    ) : (
                        <div className="space-y-3">
                            {receivedOffers.map(offer => (
                                <motion.div
                                    key={offer.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        {offer.listing?.images?.[0] && (
                                            <img src={offer.listing.images[0]} alt="" className="w-16 h-14 object-cover rounded-xl shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/listings/${offer.listing_id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 line-clamp-1">
                                                {offer.listing?.title}
                                            </Link>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                From: <span className="font-medium">{offer.buyer?.full_name}</span> ·
                                                Listed: {formatPrice(offer.listing?.price || 0)} ·
                                                Offered: <span className="font-bold text-green-600">{formatPrice(offer.amount)}</span>
                                            </p>
                                            {offer.message && <p className="text-xs text-slate-500 mt-1 italic">"{offer.message}"</p>}
                                            <p className="text-xs text-slate-400 mt-1">{formatDate(offer.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                                        <Badge variant={
                                            offer.status === 'accepted' ? 'success' :
                                                offer.status === 'rejected' ? 'error' :
                                                    offer.status === 'withdrawn' ? 'default' : 'warning'
                                        } className="capitalize">
                                            {offer.status}
                                        </Badge>
                                        {offer.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAccept(offer.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-xl"
                                                >
                                                    <CheckCircle size={12} /> Accept
                                                </button>
                                                <button
                                                    onClick={() => handleDecline(offer.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 text-xs font-medium rounded-xl"
                                                >
                                                    <XCircle size={12} /> Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sent Offers (as Buyer) */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Tag size={18} className="text-blue-500" /> Offers Sent
                    </h2>
                    {loading ? (
                        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
                    ) : sentOffers.length === 0 ? (
                        <EmptyState icon={<DollarSign size={24} />} title="No offers sent" description="You haven't made any offers yet" />
                    ) : (
                        <div className="space-y-3">
                            {sentOffers.map(offer => (
                                <motion.div
                                    key={offer.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                        {offer.listing?.images?.[0] && (
                                            <img src={offer.listing.images[0]} alt="" className="w-16 h-14 object-cover rounded-xl shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/listings/${offer.listing_id}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 truncate block">
                                                {offer.listing?.title}
                                            </Link>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Listed: {formatPrice(offer.listing?.price || 0)} ·
                                                Offered: <span className="font-semibold text-primary-600">{formatPrice(offer.amount)}</span>
                                            </p>
                                            {offer.message && <p className="text-xs text-slate-500 mt-1 truncate">{offer.message}</p>}
                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock size={11} /> {formatDate(offer.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                                        <Badge variant={
                                            offer.status === 'accepted' ? 'success' :
                                                offer.status === 'rejected' ? 'error' :
                                                    offer.status === 'withdrawn' ? 'default' : 'warning'
                                        } className="capitalize">
                                            {offer.status}
                                        </Badge>
                                        {offer.status === 'pending' && (
                                            <button
                                                onClick={() => handleWithdraw(offer.id)}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Withdraw
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};