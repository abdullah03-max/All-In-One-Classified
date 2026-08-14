import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Package, DollarSign, TrendingUp, Shield, CheckCircle,
  XCircle, Download, Search, MoreVertical, Star, Ban, Edit2, Trash2
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Badge, Button, Skeleton, EmptyState, Modal, Select, Input } from '../../components/ui';
import { usersService, paymentsService, analyticsService } from '../../services';
import { listingsService } from '../../services/listingsService';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { Listing, User, Payment } from '../../types';
import { formatPrice, formatDate, cn } from '../../utils/helpers';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const adminNav = [
  { label: 'Overview', icon: 'LayoutDashboard', to: '/admin' },
  { label: 'Listings', icon: 'Package', to: '/admin/listings' },
  { label: 'Users', icon: 'Users', to: '/admin/users' },
  { label: 'Payments', icon: 'CreditCard', to: '/admin/payments' },
  { label: 'Categories', icon: 'Tag', to: '/admin/categories' },
  { label: 'Moderators', icon: 'Shield', to: '/admin/moderators' },
  { label: 'Analytics', icon: 'BarChart2', to: '/admin/analytics' },
  { label: 'Settings', icon: 'Settings', to: '/profile' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const isJobOrService = (l: any): boolean => {
  const catId = l.category_id || '';
  const catSlug = l.category?.slug || '';
  const catName = l.category?.name || '';
  return (
    catId === 'c1000000-0000-0000-0000-000000000004' || // Jobs
    catId === 'c1000000-0000-0000-0000-000000000007' || // Services
    catSlug === 'jobs' ||
    catSlug === 'services' ||
    /jobs|services/i.test(catName)
  );
};

// ============================================================
// ADMIN OVERVIEW
// ============================================================
export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ total_listings: 0, total_users: 0, total_revenue: 0, listings_by_status: [] as { status: string }[] });
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        analyticsService.getDashboardStats(),
        listingsService.getAllListingsAdmin(),
      ]).then(([s, l]) => {
        setStats(s);
        setRecentListings(l.slice(0, 8));
      }).catch(console.error).finally(() => setLoading(false));
    };
    fetchData();

    // Subscribe to listings table changes (realtime)
    const channel = supabase
      .channel('admin-dashboard-listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const statusCounts = stats.listings_by_status.reduce((acc: Record<string, number>, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  return (
    <DashboardLayout navItems={adminNav} title="Admin Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Platform overview and management</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Listings" value={stats.total_listings.toLocaleString()} icon={<Package size={20} />} color="blue" trend={{ value: 12, label: 'vs last month' }} />
          <StatCard title="Total Users" value={stats.total_users.toLocaleString()} icon={<Users size={20} />} color="green" trend={{ value: 8, label: 'vs last month' }} />
          <StatCard title="Total Revenue" value={formatPrice(stats.total_revenue)} icon={<DollarSign size={20} />} color="purple" trend={{ value: 15, label: 'vs last month' }} />
          <StatCard title="Active Listings" value={statusCounts.active || 0} icon={<TrendingUp size={20} />} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Listings by status pie */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Listings by Status</h2>
            {loading ? <Skeleton className="h-56" /> : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No data" description="" />}
          </div>

          {/* Quick stats bars */}
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Status Breakdown</h2>
            {loading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent listings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
            <Link to="/admin/listings" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <div className="space-y-2">
              {recentListings.map(l => (
                <div key={l.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl">
                  {l.images?.[0] && <img src={l.images[0]} alt="" className="w-10 h-9 object-cover rounded-lg" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{l.title}</p>
                    <p className="text-xs text-slate-500">{l.seller?.full_name}{isJobOrService(l) ? '' : ` · ${formatPrice(l.price)}`}</p>
                  </div>
                  <Badge variant={l.status === 'active' ? 'success' : l.status === 'pending' ? 'warning' : 'default'} className="capitalize">{l.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

// ============================================================
export const AdminListingsPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingListings, setDeletingListings] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchListings = () => {
      listingsService.getAllListingsAdmin().then(setListings).finally(() => setLoading(false));
    };
    fetchListings();

    // Fetch parent categories for filtering
    supabase.from('categories').select('id, name').is('parent_id', null).then(({ data }) => {
      if (data) setCategories(data);
    });

    // Subscribe to listings table changes (realtime)
    const channel = supabase
      .channel('admin-listings-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchListings();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [search, statusFilter, categoryFilter]);

  const filtered = listings.filter(l =>
    (statusFilter ? l.status === statusFilter : true) &&
    (categoryFilter ? l.category_id === categoryFilter : true) &&
    (search ? l.title.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const handleAction = async (id: string, action: 'suspend' | 'activate' | 'feature' | 'unfeature') => {
    const listing = listings.find(l => l.id === id);
    if (!listing) return;

    const updates: Partial<Listing> =
      action === 'suspend' ? { 
        status: 'suspended',
        attributes: {
          ...listing.attributes,
          suspension_reason: 'Suspended by system administrator'
        }
      } :
      action === 'activate' ? { status: 'active' } :
      action === 'feature' ? { is_featured: true } :
      { is_featured: false };

    await listingsService.updateListing(id, updates);
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    toast.success('Listing updated');

    if (user && (action === 'suspend' || action === 'activate')) {
      try {
        const text = action === 'suspend'
          ? `Your listing "${listing.title}" has been suspended due to safety policy violations.`
          : `Your listing "${listing.title}" has been approved.`;
        const convId = await chatService.getOrCreateConversation(listing.id, user.id, listing.seller_id);
        await chatService.sendMessage(convId, user.id, text);
      } catch (err) {
        console.error('Failed to send admin system message:', err);
      }
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    try {
      await listingsService.deleteListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      toast.success('Listing deleted successfully');
    } catch (e: any) {
      toast.error('Failed to delete listing: ' + e.message);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected listings? This action cannot be undone.`)) return;

    setDeletingListings(true);
    const loadingToast = toast.loading(`Deleting ${selectedIds.length} listings...`);
    try {
      await Promise.all(selectedIds.map(id => listingsService.deleteListing(id)));
      setListings(prev => prev.filter(l => !selectedIds.includes(l.id)));
      setSelectedIds([]);
      toast.dismiss(loadingToast);
      toast.success('Selected listings deleted successfully');
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error('Failed to delete some listings: ' + e.message);
    } finally {
      setDeletingListings(false);
    }
  };

  const handleSelectAll = () => {
    const allFilteredSelected = filtered.every(l => selectedIds.includes(l.id));
    if (allFilteredSelected) {
      setSelectedIds(prev => prev.filter(id => !filtered.some(l => l.id === id)));
    } else {
      setSelectedIds(prev => {
        const newSelected = [...prev];
        filtered.forEach(l => {
          if (!newSelected.includes(l.id)) newSelected.push(l.id);
        });
        return newSelected;
      });
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const exportCSV = () => {
    const headers = ['Title', 'Price', 'Status', 'Seller', 'City', 'Created'];
    const rows = filtered.map(l => [l.title, l.price, l.status, l.seller?.full_name || '', l.city, l.created_at]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'listings.csv'; a.click();
    toast.success('CSV exported');
  };

  return (
    <DashboardLayout navItems={adminNav} title="Manage Listings">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Manage Listings</h1>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={handleDeleteSelected}
                loading={deletingListings}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
            <Button variant="secondary" icon={<Download size={16} />} onClick={exportCSV}>Export CSV</Button>
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          <div className="relative w-full max-w-xl">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search listings..."
              className="input pl-9"
            />
          </div>
          <Select
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            placeholder="All categories"
            className="w-48"
          />
          <Select
            options={[
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'sold', label: 'Sold' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            placeholder="All statuses"
            className="w-40"
          />
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 w-10 text-left">
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && filtered.every(l => selectedIds.includes(l.id))}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer w-4 h-4"
                      />
                    </th>
                    <th className="text-left p-3 font-medium text-slate-500">Listing</th>
                    <th className="text-left p-3 font-medium text-slate-500">Seller</th>
                    <th className="text-left p-3 font-medium text-slate-500">Price</th>
                    <th className="text-left p-3 font-medium text-slate-500">Status</th>
                    <th className="text-left p-3 font-medium text-slate-500">Date</th>
                    <th className="text-right p-3 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="p-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(l.id)}
                          onChange={() => handleSelectRow(l.id)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {l.images?.[0] && <img src={l.images[0]} alt="" className="w-9 h-8 object-cover rounded-lg" />}
                          <div>
                            <Link to={`/listings/${l.id}`} target="_blank" className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 truncate max-w-48 block">
                              {l.title}
                            </Link>
                            {l.category && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{l.category.name}</span>
                            )}
                          </div>
                          {l.is_featured && <Star size={12} className="text-accent-500 fill-accent-500 shrink-0 ml-1" />}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{l.seller?.full_name}</td>
                      <td className="p-3 font-medium text-slate-900 dark:text-slate-100">{isJobOrService(l) ? '' : formatPrice(l.price)}</td>
                      <td className="p-3"><Badge variant={l.status === 'active' ? 'success' : l.status === 'pending' ? 'warning' : l.status === 'suspended' ? 'error' : 'default'} className="capitalize">{l.status}</Badge></td>
                      <td className="p-3 text-slate-500 text-xs">{formatDate(l.created_at)}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          {l.status === 'active' ? (
                            <button onClick={() => handleAction(l.id, 'suspend')} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Suspend">
                              <Ban size={14} />
                            </button>
                          ) : (
                            <button onClick={() => handleAction(l.id, 'activate')} className="p-1.5 text-slate-400 hover:text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20" title="Activate">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(l.id, l.is_featured ? 'unfeature' : 'feature')}
                            className={cn('p-1.5 rounded-lg', l.is_featured ? 'text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/20' : 'text-slate-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/20')}
                            title="Toggle featured"
                          >
                            <Star size={14} className={l.is_featured ? 'fill-accent-500' : ''} />
                          </button>
                          <button
                            onClick={() => handleDeleteListing(l.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete listing"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">No listings found</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// ============================================================
// ADMIN USERS PAGE
// ============================================================
export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; userId?: string; userName?: string }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(() => {
    usersService.getAllUsers().then(d => {
      // Filter to only include buyers and sellers (no moderators, admins, or super admins)
      const regularUsers = (d as unknown as User[]).filter(u => u.role === 'buyer' || u.role === 'seller');
      setUsers(regularUsers);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();

    // Supabase Realtime subscription for automatic instant updates in Admin Panel
    const channel = supabase
      .channel('admin-users-table-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchUsers]);

  const filtered = users.filter(u => {
    const matchesSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    let matchesVerification = true;
    if (verificationFilter === 'email_verified') {
      matchesVerification = u.email_verified;
    } else if (verificationFilter === 'email_unverified') {
      matchesVerification = !u.email_verified;
    } else if (verificationFilter === 'account_verified') {
      matchesVerification = u.is_verified;
    } else if (verificationFilter === 'account_unverified') {
      matchesVerification = !u.is_verified;
    }
    return matchesSearch && matchesVerification;
  });

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await usersService.updateUser(id, { is_active: !isActive });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !isActive } : u));
    toast.success(isActive ? 'User suspended' : 'User activated');
  };

  const handleVerify = async (id: string) => {
    await usersService.updateUser(id, { is_verified: true });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_verified: true } : u));
    toast.success('User verified');
  };

  const handleRoleChange = async (id: string, role: string) => {
    // Prevent changing any user to super_admin
    if (role === 'super_admin') {
      toast.error('Super Admin role cannot be assigned to regular users');
      return;
    }
    await usersService.updateUser(id, { role });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: role as User['role'] } : u));
    toast.success('Role updated');
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.userId) return;
    // Safety check - prevent deleting super_admin
    const userToDelete = users.find(u => u.id === deleteModal.userId);
    if (userToDelete?.role === 'super_admin') {
      toast.error('Super Admin cannot be deleted');
      setDeleteModal({ open: false });
      return;
    }
    setDeleting(true);
    try {
      await usersService.deleteUser(deleteModal.userId);
      setUsers(prev => prev.filter(u => u.id !== deleteModal.userId));
      toast.success(`User "${deleteModal.userName}" deleted successfully`);
      setDeleteModal({ open: false });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout navItems={adminNav} title="Manage Users">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Manage Users</h1>

        <div className="flex gap-3 mb-5">
          <div className="relative w-full max-w-xl">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name or email..." className="input pl-9" />
          </div>
          <Select
            options={[
              { value: 'email_verified', label: 'Email Verified' },
              { value: 'email_unverified', label: 'Email Unverified' },
              { value: 'account_verified', label: 'Account Verified' },
              { value: 'account_unverified', label: 'Account Unverified' },
            ]}
            value={verificationFilter}
            onChange={e => setVerificationFilter(e.target.value)}
            placeholder="All verification statuses"
            className="w-56"
          />
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-500">User</th>
                    <th className="text-left p-3 font-medium text-slate-500">Email Status</th>
                    <th className="text-left p-3 font-medium text-slate-500">Account KYC</th>
                    <th className="text-left p-3 font-medium text-slate-500">Status</th>
                    <th className="text-left p-3 font-medium text-slate-500">Joined</th>
                    <th className="text-right p-3 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1">
                            {u.full_name}
                            {u.is_verified && <CheckCircle size={12} className="text-green-500" />}
                          </p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </td>

                      <td className="p-3">
                        <Badge variant={u.email_verified ? 'success' : 'default'}>
                          {u.email_verified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </td>

                      <td className="p-3">
                        <Badge variant={u.is_verified ? 'success' : 'default'}>
                          {u.is_verified ? 'Verified User' : 'Unverified'}
                        </Badge>
                      </td>

                      <td className="p-3">
                        <Badge variant={u.is_active ? 'success' : 'error'}>{u.is_active ? 'Active' : 'Deactivated'}</Badge>
                      </td>
                      <td className="p-3 text-slate-500 text-xs">{formatDate(u.created_at)}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          {!u.is_verified && (
                            <button onClick={() => handleVerify(u.id)} className="p-1.5 text-slate-400 hover:text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20" title="Verify User">
                              <Shield size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            className={cn('p-1.5 rounded-lg', u.is_active ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20')}
                            title={u.is_active ? 'Suspend' : 'Activate'}
                          >
                            {u.is_active ? <Ban size={14} /> : <CheckCircle size={14} />}
                          </button>
                          {u.role !== 'super_admin' && (
                            <button
                              onClick={() => setDeleteModal({ open: true, userId: u.id, userName: u.full_name })}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete user"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No users found</div>}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteModal.open && (
          <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false })}>
            <div className="p-6 max-w-md">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                <Trash2 size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center mb-2">Delete User</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                Are you sure you want to delete <strong>{deleteModal.userName}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setDeleteModal({ open: false })} disabled={deleting}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteUser} loading={deleting}>
                  Delete
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

// ============================================================
// PAYMENT VERIFICATION PAGE
// ============================================================
export const AdminPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<(Payment & { user?: User; listing?: Listing })[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      const d = await paymentsService.getPayments();
      setPayments(d as unknown as (Payment & { user?: User; listing?: Listing })[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (id: string, status: 'completed' | 'failed') => {
    try {
      if (user?.id) {
        await paymentsService.approveAndPromote(id, user.id, status);
      } else {
        await paymentsService.updatePayment(id, { status });
      }
      toast.success(status === 'completed' ? '🎉 Payment approved & Featured status activated!' : 'Payment marked as rejected');
      fetchPayments();
    } catch (err: any) {
      toast.error('Failed to update payment: ' + (err.message || 'Error'));
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <DashboardLayout navItems={adminNav} title="Payment Verification">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payment & Promotion Verification</h1>
            <p className="text-xs text-slate-500">Manage transaction receipts, verify local transfers, and activate featured ad promotions</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Revenue</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              PKR {totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-primary-500/10 to-indigo-500/10 border-primary-200 dark:border-primary-800">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Total Transactions</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {payments.length}
            </div>
          </div>
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : payments.length === 0 ? (
          <EmptyState icon={<DollarSign size={28} />} title="No payments yet" description="Submitted promotion payments will appear here for verification" />
        ) : (
          <div className="space-y-3">
            {payments.map(p => (
              <div key={p.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-primary-100 dark:bg-primary-900/40 text-primary-600 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        {formatPrice(p.amount, p.currency)}
                      </span>
                      {p.package_name && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {p.package_name} ({p.duration_days || 7} Days)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      User: <strong>{p.user?.full_name || 'User'}</strong> ({p.user?.email})
                    </p>
                    {p.listing && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Listing: <Link to={`/listings/${p.listing.id}`} className="text-primary-600 hover:underline font-medium">{p.listing.title}</Link>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                      <span>Method: <strong className="text-slate-700 dark:text-slate-300">{p.method}</strong></span>
                      {p.transaction_id && <span>TRX ID: <strong className="font-mono text-slate-700 dark:text-slate-300">{p.transaction_id}</strong></span>}
                      <span>Date: {formatDate(p.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  {p.receipt_url && (
                    <button
                      onClick={() => setPreviewReceipt(p.receipt_url || null)}
                      className="px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      View Receipt
                    </button>
                  )}
                  <Badge variant={p.status === 'completed' ? 'success' : p.status === 'failed' ? 'error' : 'warning'} className="capitalize">
                    {p.status}
                  </Badge>
                  {p.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="xs" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => handleVerify(p.id, 'completed')}>
                        Approve & Promote
                      </Button>
                      <Button size="xs" variant="danger" onClick={() => handleVerify(p.id, 'failed')}>
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {previewReceipt && (
        <Modal isOpen={!!previewReceipt} onClose={() => setPreviewReceipt(null)} title="Payment Receipt Screenshot" size="md">
          <div className="p-2 space-y-4">
            <img src={previewReceipt} alt="Receipt" className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-200 dark:border-slate-800" />
            <div className="flex justify-end">
              <Button onClick={() => setPreviewReceipt(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export { adminNav };
export { AdminVerificationPage } from './AdminVerificationPage';
