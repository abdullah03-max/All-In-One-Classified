import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ListingForm from '../../components/listings/ListingForm';
import { Skeleton } from '../../components/ui';
import { listingsService } from '../../services/listingsService';
import { Listing } from '../../types';

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

const EditListingPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            navigate('/dashboard/listings');
            return;
        }

        const loadListing = async () => {
            try {
                const data = await listingsService.getListing(id);
                setListing(data);
            } catch (error) {
                console.error('Error loading listing:', error);
                setLoadError('Unable to load listing. It may have been deleted.');
                navigate('/dashboard/listings');
            } finally {
                setLoading(false);
            }
        };

        loadListing();
    }, [id, navigate]);

    if (authLoading || loading) {
        return (
            <DashboardLayout navItems={navItems} title="Edit Listing">
                <div className="flex justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
                </div>
            </DashboardLayout>
        );
    }

    if (!user) {
        return (
            <DashboardLayout navItems={navItems} title="Edit Listing">
                <div className="card p-8 text-center">
                    <p className="text-sm text-slate-500">Please sign in to edit your listing.</p>
                </div>
            </DashboardLayout>
        );
    }

    if (loadError) {
        return (
            <DashboardLayout navItems={navItems} title="Edit Listing">
                <div className="card p-8 text-center">
                    <p className="text-sm text-red-500">{loadError}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout navItems={navItems} title="Edit Listing">
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit Listing</h1>
                </div>
                <div className="max-w-2xl">
                    {listing ? (
                        <ListingForm listing={listing} onSuccess={() => navigate('/dashboard/listings')} />
                    ) : (
                        <div className="card p-8 text-center">
                            <p className="text-sm text-slate-500">Listing not found.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditListingPage;