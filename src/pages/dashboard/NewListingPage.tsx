import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ListingForm from '../../components/listings/ListingForm';
import { Skeleton } from '../../components/ui';

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

const NewListingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <DashboardLayout navItems={navItems} title="Post New Ad">
                <div className="flex justify-center py-20">
                    <div className="animate-spin w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full" />
                </div>
            </DashboardLayout>
        );
    }

    if (!user) {
        return (
            <DashboardLayout navItems={navItems} title="Post New Ad">
                <div className="card p-8 text-center">
                    <p className="text-sm text-slate-500">Please sign in to create a listing.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout navItems={navItems} title="Post New Ad">
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Post New Ad</h1>
                </div>
                <div className="max-w-2xl">
                    <ListingForm onSuccess={() => navigate('/dashboard/listings')} />
                </div>
            </div>
        </DashboardLayout>
    );
};

export default NewListingPage;