import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Flag, Clock, Eye, AlertTriangle,
  MessageSquare, Package, Shield, ArrowLeft, ShieldAlert,
  Smartphone, MapPin, User as UserIcon, Sparkles, Play, ArrowUpRight, Lock,
  Plus, Check, X, BarChart, CheckSquare, XSquare, AlertOctagon, Tag, Send, Search
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Badge, Button, Skeleton, EmptyState, Modal, Textarea, Avatar, Spinner } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { listingsService } from '../../services/listingsService';
import { reportsService, notificationsService, usersService } from '../../services';
import { chatService } from '../../services/chatService';
import { Listing, Report, Conversation, Message, User } from '../../types';
import { formatPrice, formatDate, cn, getUserRoles, userHasAnyRole } from '../../utils/helpers';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import ImageGallery from '../../components/listings/ImageGallery';
import { aiService } from '../../services/aiService';

const moderatorNav = [
  { label: 'Overview', icon: 'LayoutDashboard', to: '/moderator' },
  { label: 'Pending Listings', icon: 'Clock', to: '/moderator/pending' },
  { label: 'Reports', icon: 'Flag', to: '/moderator/reports' },
  { label: 'Messages', icon: 'MessageSquare', to: '/moderator/messages' },
  { label: 'My Performance', icon: 'BarChart2', to: '/moderator/performance' },
  { label: 'Settings', icon: 'Settings', to: '/profile' },
];

const isPricingDisabled = (listing: Listing) => {
  const catId = listing.category_id;
  const catSlug = listing.category?.slug;
  const catName = listing.category?.name;

  return (
    catId === 'c1000000-0000-0000-0000-000000000004' || // Jobs
    catId === 'c1000000-0000-0000-0000-000000000007' || // Services
    catSlug === 'jobs' || catSlug === 'services' ||
    catName === 'Jobs' || catName === 'Services'
  );
};

const sendSystemMessage = async (listing: Listing, moderatorId: string, text: string) => {
  try {
    const convId = await chatService.getOrCreateConversation(listing.id, moderatorId, listing.seller_id);
    await chatService.sendMessage(convId, moderatorId, text);
  } catch (err) {
    console.error('Failed to send system chat message:', err);
  }
};

// ============================================================
// MODERATOR OVERVIEW
// ============================================================
export const ModeratorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    reviewedToday: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalReviewed: 0,
    totalApproved: 0,
    totalRejected: 0
  });
  const [myStats, setMyStats] = useState({
    reviewed: 0,
    approved: 0,
    rejected: 0,
    reports: 0
  });

  const fetchData = async () => {
    try {
      const [listings, reps, { data: allListings }] = await Promise.all([
        listingsService.getPendingListings(),
        reportsService.getReports(),
        supabase.from('listings').select('status, updated_at, moderated_by')
      ]);
      
      setPendingListings(listings);
      setReports(reps);

      // Calculate statistics
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let reviewedToday = 0;
      let approvedToday = 0;
      let rejectedToday = 0;

      let totalReviewed = 0;
      let totalApproved = 0;
      let totalRejected = 0;

      let myReviewed = 0;
      let myApproved = 0;
      let myRejected = 0;

      if (allListings) {
        allListings.forEach(item => {
          const updatedAt = new Date(item.updated_at);
          const isToday = updatedAt >= startOfToday;

          const isApproved = item.status === 'active' || item.status === 'sold';
          const isRejected = item.status === 'rejected';
          const isSuspendedOrChanges = item.status === 'suspended' || item.status === 'changes_requested';
          const isReviewed = isApproved || isRejected || isSuspendedOrChanges;

          if (isReviewed) {
            totalReviewed++;
            if (isToday) reviewedToday++;
          }
          if (isApproved) {
            totalApproved++;
            if (isToday) approvedToday++;
          }
          if (isRejected) {
            totalRejected++;
            if (isToday) rejectedToday++;
          }

          // Personal stats
          if (user && item.moderated_by === user.id) {
            myReviewed++;
            if (isApproved) myApproved++;
            if (isRejected) myRejected++;
          }
        });
      }

      let myReportsCount = 0;
      if (reps && user) {
        reps.forEach(item => {
          if (item.status !== 'pending' && item.moderator_id === user.id) {
            myReportsCount++;
          }
        });
      }

      setStats({
        reviewedToday,
        approvedToday,
        rejectedToday,
        totalReviewed,
        totalApproved,
        totalRejected
      });

      setMyStats({
        reviewed: myReviewed,
        approved: myApproved,
        rejected: myRejected,
        reports: myReportsCount
      });
    } catch (err) {
      console.error('Error fetching moderator stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to listings changes
    const listingsChannel = supabase
      .channel('mod-dashboard-listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchData();
      })
      .subscribe();

    // Subscribe to reports changes
    const reportsChannel = supabase
      .channel('mod-dashboard-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      listingsChannel.unsubscribe();
      reportsChannel.unsubscribe();
    };
  }, [user]);

  const pendingReports = reports.filter(r => r.status === 'pending');

  return (
    <DashboardLayout navItems={moderatorNav} title="Moderator Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">Moderator Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review listings and handle reports</p>
        </div>

        {/* My Performance Highlights */}
        <div className="space-y-3 p-5 bg-gradient-to-br from-primary-500/5 to-transparent border border-primary-500/10 dark:border-primary-500/20 rounded-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart size={14} /> My Performance Highlights
            </h2>
            <Link to="/moderator/performance" className="text-xs text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 font-semibold hover:underline flex items-center gap-0.5">
              View Detailed Analytics <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            <StatCard title="Reviewed by Me" value={myStats.reviewed} icon={<CheckCircle size={20} />} color="green" />
            <StatCard title="Approved by Me" value={myStats.approved} icon={<CheckSquare size={20} />} color="green" />
            <StatCard title="Rejected by Me" value={myStats.rejected} icon={<XCircle size={20} />} color="red" />
            <StatCard title="Reports Resolved by Me" value={myStats.reports} icon={<Flag size={20} />} color="purple" />
          </div>
        </div>

        {/* Platform Overview */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Pending Review" value={pendingListings.length} icon={<Clock size={20} />} color="orange" />
            <StatCard title="Open Reports" value={pendingReports.length} icon={<Flag size={20} />} color="red" />
            <StatCard title="Total Reports" value={reports.length} icon={<AlertTriangle size={20} />} color="purple" />
          </div>
        </div>

        {/* Today's Moderation activity */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Today's Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Listings Reviewed Today" value={stats.reviewedToday} icon={<CheckCircle size={20} />} color="green" />
            <StatCard title="Listings Approved Today" value={stats.approvedToday} icon={<CheckSquare size={20} />} color="green" />
            <StatCard title="Listings Rejected Today" value={stats.rejectedToday} icon={<XCircle size={20} />} color="red" />
          </div>
        </div>

        {/* Overall Stats */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overall Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Listings Reviewed" value={stats.totalReviewed} icon={<BarChart size={20} />} color="orange" />
            <StatCard title="Total Listings Approved" value={stats.totalApproved} icon={<CheckSquare size={20} />} color="green" />
            <StatCard title="Total Listings Rejected" value={stats.totalRejected} icon={<XSquare size={20} />} color="red" />
          </div>
        </div>

        {/* Pending listings preview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" /> Listings Awaiting Review
            </h2>
            <Link to="/moderator/pending" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : pendingListings.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No listings pending review 🎉</p>
          ) : (
            <div className="space-y-2">
              {pendingListings.slice(0, 5).map(l => (
                <div key={l.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl">
                  {l.images?.[0] && <img src={l.images[0]} alt="" className="w-12 h-10 object-cover rounded-lg" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{l.title}</p>
                    <p className="text-xs text-slate-500">by {l.seller?.full_name} {isPricingDisabled(l) ? '' : `· ${formatPrice(l.price)}`}</p>
                  </div>
                  <Link to={`/moderator/preview/${l.id}`} className="text-xs text-primary-600 hover:underline shrink-0">Review</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reports */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Flag size={18} className="text-red-500" /> Recent Reports
            </h2>
            <Link to="/moderator/reports" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {pendingReports.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No open reports</p>
          ) : (
            <div className="space-y-2">
              {pendingReports.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center shrink-0">
                    <Flag size={14} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.listing?.title}</p>
                    <p className="text-xs text-slate-500">{r.reason} · by {r.reporter?.full_name}</p>
                  </div>
                  <Link to="/moderator/reports" className="text-xs text-primary-600 hover:underline shrink-0">Review</Link>
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
// PENDING LISTINGS REVIEW PAGE
// ============================================================
export const PendingListingsPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchPending = () => {
      listingsService.getPendingListings().then(setListings).finally(() => setLoading(false));
    };
    fetchPending();

    const channel = supabase
      .channel('mod-pending-listings-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchPending();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleApprove = async (listing: Listing) => {
    setProcessing(true);
    try {
      await listingsService.updateListing(listing.id, { 
        status: 'active',
        moderated_by: user?.id,
        moderated_at: new Date().toISOString()
      });
      
      // Send real-time notification
      await notificationsService.createNotification({
        user_id: listing.seller_id,
        type: 'listing_status',
        title: 'Listing Approved',
        message: 'Your listing has been approved.',
        is_read: false,
        data: { listing_id: listing.id }
      });

      if (user) {
        await sendSystemMessage(listing, user.id, `Your listing "${listing.title}" has been approved.`);
      }

      setListings(prev => prev.filter(l => l.id !== listing.id));
      toast.success('Listing approved and published');
    } catch {
      toast.error('Failed to approve listing');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await listingsService.updateListing(selected.id, { 
        status: 'rejected',
        moderated_by: user?.id,
        moderated_at: new Date().toISOString(),
        attributes: {
          ...selected.attributes,
          rejection_reason: rejectReason
        }
      });

      // Send real-time notification with rejection reason
      await notificationsService.createNotification({
        user_id: selected.seller_id,
        type: 'listing_status',
        title: 'Listing Rejected',
        message: `Your listing was rejected. Reason: ${rejectReason}`,
        is_read: false,
        data: { listing_id: selected.id, rejection_reason: rejectReason }
      });

      if (user) {
        await sendSystemMessage(selected, user.id, `Your listing "${selected.title}" has been rejected. Reason: ${rejectReason}`);
      }

      setListings(prev => prev.filter(l => l.id !== selected.id));
      toast.success('Listing rejected');
      setRejectModalOpen(false);
      setSelected(null);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject listing');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout navItems={moderatorNav} title="Pending Listings">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pending Listings</h1>
          <Badge variant="warning">{listings.length} awaiting review</Badge>
        </div>

        {loading ? (
          <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        ) : listings.length === 0 ? (
          <EmptyState icon={<CheckCircle size={28} />} title="All caught up!" description="No listings are currently pending review" />
        ) : (
          <div className="space-y-4">
            {listings.map(listing => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <div className="flex gap-4">
                  <div className="flex gap-2 shrink-0">
                    {listing.images?.slice(0, 2).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-20 h-20 object-cover rounded-xl" />
                    ))}
                    {listing.images?.length > 2 && (
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-xs text-slate-500">
                        +{listing.images.length - 2}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{listing.title}</h3>
                        {!isPricingDisabled(listing) && (
                          <p className="text-sm text-primary-600 font-bold mt-0.5">{formatPrice(listing.price)}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(listing.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{listing.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>By: {listing.seller?.full_name}</span>
                      <span>City: {listing.city}</span>
                      <span>Category: {listing.category?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <Link to={`/moderator/preview/${listing.id}`}>
                    <Button variant="secondary" size="sm" icon={<Eye size={14} />}>Preview</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-green-600 hover:bg-green-700"
                    icon={<CheckCircle size={14} />}
                    onClick={() => handleApprove(listing)}
                    loading={processing}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<XCircle size={14} />}
                    onClick={() => { setSelected(listing); setRejectModalOpen(true); }}
                  >
                    Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Listing" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Provide a reason for rejecting "<strong>{selected?.title}</strong>"
          </p>
          <Textarea
            placeholder="e.g. Prohibited item, misleading images, incorrect category..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleReject} loading={processing}>Confirm Reject</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

// ============================================================
// REPORTS PAGE
// ============================================================
export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const fetchReports = () => {
      reportsService.getReports().then(setReports).finally(() => setLoading(false));
    };
    fetchReports();

    const channel = supabase
      .channel('mod-reports-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  const handleResolve = async (id: string, status: Report['status']) => {
    await reportsService.updateReport(id, { 
      status,
      moderator_id: user?.id
    });
    setReports(prev => prev.map(r => r.id === id ? { ...r, status, moderator_id: user?.id } : r));
    toast.success('Report updated');
  };

  const statusVariant: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
    pending: 'warning', reviewed: 'info', resolved: 'success', dismissed: 'default'
  };

  return (
    <DashboardLayout navItems={moderatorNav} title="Reports">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Content Reports</h1>

        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 w-fit">
          {['pending', 'reviewed', 'resolved', 'dismissed', 'all'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                filter === s ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Flag size={28} />} title="No reports" description="No reports match this filter" />
        ) : (
          <div className="space-y-3">
            {filtered.map(report => (
              <motion.div key={report.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-4">
                <div className="flex items-start gap-4">
                  {report.listing?.images?.[0] && (
                    <img src={report.listing.images[0]} alt="" className="w-16 h-16 object-cover rounded-xl shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link to={`/moderator/report/${report.id}`} className="font-medium text-sm text-slate-900 dark:text-slate-100 hover:text-primary-600 truncate">
                        {report.listing?.title}
                      </Link>
                      <Badge variant={statusVariant[report.status]} className="capitalize shrink-0">{report.status}</Badge>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">{report.reason}</p>
                    {report.description && <p className="text-xs text-slate-500 mt-1">{report.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>Reported by: {report.reporter?.full_name}</span>
                      <span>{formatDate(report.created_at)}</span>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <Button size="xs" variant="secondary" onClick={() => handleResolve(report.id, 'reviewed')}>Mark Reviewed</Button>
                        <Button size="xs" variant="danger" onClick={() => handleResolve(report.id, 'resolved')}>Resolve</Button>
                        <Button size="xs" variant="ghost" onClick={() => handleResolve(report.id, 'dismissed')}>Dismiss</Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// ============================================================
// DEDICATED MODERATOR PREVIEW PAGE
// ============================================================
const ignoredKeys = new Set([
  'virtual_category_id',
  'virtual_subcategory_id',
  'virtual_sub_subcategory_id',
  'subcategory_name',
  'sub_subcategory_name',
  'contact_name',
  'show_phone'
]);

export const ModeratorPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Modals and reasons
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const [changesReason, setChangesReason] = useState('');
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  // AI analysis
  const [aiAnalysis, setAiAnalysis] = useState<{ isSpam: boolean; reason?: string } | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            category:categories!listings_category_id_fkey(id, name, slug, icon, color),
            subcategory:categories!listings_subcategory_id_fkey(id, name, slug),
            seller:users!listings_seller_id_fkey(id, full_name, email, phone, avatar_url, is_verified)
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setListing(data as unknown as Listing);
      } catch (err: any) {
        toast.error('Failed to load listing details');
        navigate('/moderator/pending');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchListing();
  }, [id, navigate]);

  useEffect(() => {
    if (listing) {
      setAnalyzingAi(true);
      aiService.detectSpam(listing.title, listing.description, listing.price)
        .then(setAiAnalysis)
        .catch(console.error)
        .finally(() => setAnalyzingAi(false));
    }
  }, [listing]);

  if (loading) {
    return (
      <DashboardLayout navItems={moderatorNav} title="Moderator Review">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!listing) {
    return (
      <DashboardLayout navItems={moderatorNav} title="Moderator Review">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Listing Not Found</h2>
          <Button className="mt-4" onClick={() => navigate('/moderator/pending')}>Back to Pending</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await listingsService.updateListing(listing.id, { 
        status: 'active',
        moderated_by: user?.id,
        moderated_at: new Date().toISOString()
      });
      
      await notificationsService.createNotification({
        user_id: listing.seller_id,
        type: 'listing_status',
        title: 'Listing Approved',
        message: 'Your listing has been approved.',
        is_read: false,
        data: { listing_id: listing.id }
      });

      if (user) {
        await sendSystemMessage(listing, user.id, `Your listing "${listing.title}" has been approved.`);
      }

      toast.success('Listing approved and published');
      navigate('/moderator/pending');
    } catch {
      toast.error('Failed to approve listing');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setProcessing(true);
    try {
      await listingsService.updateListing(listing.id, { 
        status: 'rejected',
        moderated_by: user?.id,
        moderated_at: new Date().toISOString(),
        attributes: {
          ...listing.attributes,
          rejection_reason: rejectReason
        }
      });

      await notificationsService.createNotification({
        user_id: listing.seller_id,
        type: 'listing_status',
        title: 'Listing Rejected',
        message: `Your listing was rejected. Reason: ${rejectReason}`,
        is_read: false,
        data: { listing_id: listing.id, rejection_reason: rejectReason }
      });

      if (user) {
        await sendSystemMessage(listing, user.id, `Your listing "${listing.title}" has been rejected. Reason: ${rejectReason}`);
      }

      toast.success('Listing rejected');
      setRejectModalOpen(false);
      navigate('/moderator/pending');
    } catch {
      toast.error('Failed to reject listing');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changesReason.trim()) {
      toast.error('Please enter change requests details');
      return;
    }
    setProcessing(true);
    try {
      await listingsService.updateListing(listing.id, { 
        status: 'changes_requested',
        moderated_by: user?.id,
        moderated_at: new Date().toISOString(),
        attributes: {
          ...listing.attributes,
          changes_reason: changesReason
        }
      });

      await notificationsService.createNotification({
        user_id: listing.seller_id,
        type: 'listing_status',
        title: 'Changes Requested',
        message: `Please update your listing. Required changes: ${changesReason}`,
        is_read: false,
        data: { listing_id: listing.id, changes_reason: changesReason }
      });

      if (user) {
        await sendSystemMessage(listing, user.id, `Changes have been requested for your listing "${listing.title}". Required changes: ${changesReason}`);
      }

      toast.success('Changes requested successfully');
      setChangesModalOpen(false);
      navigate('/moderator/pending');
    } catch (err: any) {
      if (err.message?.includes('enum') || err.code === '22P02') {
        toast.error('Error: "changes_requested" status is not enabled in your database. Please run the SQL command in the implementation plan inside your Supabase Dashboard SQL Editor!');
      } else {
        toast.error('Failed to request changes');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      toast.error('Please enter a suspension reason');
      return;
    }
    setProcessing(true);
    try {
      await listingsService.updateListing(listing.id, { 
        status: 'suspended',
        moderated_by: user?.id,
        moderated_at: new Date().toISOString(),
        attributes: {
          ...listing.attributes,
          suspension_reason: suspensionReason
        }
      });

      await notificationsService.createNotification({
        user_id: listing.seller_id,
        type: 'listing_status',
        title: 'Listing Suspended',
        message: `Your listing has been suspended due to safety policy violations. Reason: ${suspensionReason}`,
        is_read: false,
        data: { listing_id: listing.id }
      });

      if (user) {
        await sendSystemMessage(listing, user.id, `Your listing "${listing.title}" has been suspended due to safety policy violations. Reason: ${suspensionReason}`);
      }

      toast.success('Listing suspended');
      setSuspendModalOpen(false);
      navigate('/moderator/pending');
    } catch {
      toast.error('Failed to suspend listing');
    } finally {
      setProcessing(false);
    }
  };

  // Breadcrumbs category line helper
  const catHierarchy = [
    listing.category?.name,
    listing.attributes?.subcategory_name,
    listing.attributes?.sub_subcategory_name
  ].filter(Boolean).join(' › ');

  return (
    <DashboardLayout navItems={moderatorNav} title="Listing Moderator Review">
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button 
            onClick={() => navigate('/moderator/pending')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors w-fit"
          >
            <ArrowLeft size={16} /> Return to Pending Review
          </button>
          
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="capitalize">
              {listing.status.replace(/_/g, ' ')}
            </Badge>
            <span className="text-xs text-slate-400">Created {formatDate(listing.created_at)}</span>
          </div>
        </div>

        {/* Listing Title Banner */}
        <div className="card p-5 bg-gradient-to-r from-amber-500/10 to-surface">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{listing.title}</h1>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
            <Tag size={13} className="text-slate-400" /> {catHierarchy || 'General Category'}
          </p>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Visuals & Specifications */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Image Gallery */}
            <div className="card overflow-hidden">
              <ImageGallery images={listing.images} videoUrl={listing.video_url} title={listing.title} />
            </div>

            {/* Video preview if available */}
            {listing.video_url && (
              <div className="card p-4 flex items-center justify-between gap-4 border border-primary-100 dark:border-primary-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-950/30 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                    <Play size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Video Attachment Attached</h3>
                    <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">{listing.video_url}</p>
                  </div>
                </div>
                <a href={listing.video_url} target="_blank" rel="noreferrer" className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                  View Video <ArrowUpRight size={13} />
                </a>
              </div>
            )}

            {/* Description */}
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b pb-2">Description</h2>
              <p className="text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line text-sm">
                {listing.description}
              </p>
            </div>

            {/* Dynamic custom specifications */}
            {listing.attributes && Object.keys(listing.attributes).length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 border-b pb-2">Listing Specifications</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(listing.attributes).map(([key, value]) => {
                    if (!value || ignoredKeys.has(key.toLowerCase())) return null;
                    const formattedKey = key
                      .replace(/_/g, ' ')
                      .replace(/-/g, ' ')
                      .replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div key={key} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{formattedKey}</span>
                        <p className="font-medium text-sm text-slate-850 dark:text-slate-200 capitalize mt-1">{value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Seller Profile & AI Insights */}
          <div className="space-y-6">
            
            {/* Price Card */}
            {!isPricingDisabled(listing) && (
              <div className="card p-5 bg-primary-950/5 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 text-center">
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Listing Price</span>
                <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">{formatPrice(listing.price)}</p>
                {listing.is_negotiable && (
                  <Badge variant="success" className="mt-2.5 mx-auto w-fit">Price Negotiable</Badge>
                )}
              </div>
            )}

            {/* Seller profile card */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b pb-2 flex items-center gap-2">
                <UserIcon size={16} className="text-slate-400" /> Seller Profile
              </h3>
              <div className="flex items-center gap-3">
                <img 
                  src={listing.seller?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150'} 
                  alt="" 
                  className="w-12 h-12 object-cover rounded-full bg-slate-100 dark:bg-slate-800 border"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {listing.seller?.full_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant={listing.seller?.is_verified ? 'success' : 'default'} className="text-[9px] px-1 py-0 scale-95 shrink-0">
                      {listing.seller?.is_verified ? 'Verified Seller' : 'Standard Account'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-500 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span>Email:</span>
                  <span className="text-slate-700 dark:text-slate-350 select-all font-mono">{listing.seller?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phone:</span>
                  <span className="text-slate-700 dark:text-slate-350 select-all font-mono">{listing.seller?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Target City:</span>
                  <span className="text-slate-700 dark:text-slate-350 capitalize font-medium">{listing.city}</span>
                </div>
                {listing.location && (
                  <div className="flex items-start justify-between gap-1">
                    <span className="shrink-0">Location:</span>
                    <span className="text-slate-750 dark:text-slate-350 text-right font-medium leading-relaxed">{listing.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI analysis card */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b pb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-primary-500 animate-pulse" /> AI Safety Insights
              </h3>
              
              {analyzingAi ? (
                <div className="flex flex-col items-center justify-center py-6 text-xs text-slate-400 gap-2">
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Running spam & template scan...</span>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Spam Scan Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      {aiAnalysis.isSpam ? (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
                          <span className="text-sm font-semibold text-red-600 dark:text-red-500">Flags Detected</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-500">Clean / Passed</span>
                        </>
                      )}
                    </div>
                  </div>

                  {aiAnalysis.reason && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl text-xs text-red-700 dark:text-red-400 leading-relaxed font-medium">
                      ⚠️ {aiAnalysis.reason}
                    </div>
                  )}

                  <div className="space-y-2 text-xs text-slate-500 pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Title Strength:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {listing.title.length > 25 ? 'High Depth' : 'Brief Title'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Description depth:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {listing.description.length > 100 ? 'Comprehensive' : 'Minimalist'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Image count:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {listing.images?.length || 0} attachments
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">AI analysis unavailable</p>
              )}
            </div>

          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-center gap-3 z-40">
          <div className="flex flex-wrap justify-center gap-3 max-w-5xl w-full px-4">
            
            <Button
              variant="secondary"
              icon={<ArrowLeft size={15} />}
              onClick={() => navigate('/moderator/pending')}
              disabled={processing}
              className="px-4"
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-5"
              icon={<CheckCircle size={15} />}
              onClick={handleApprove}
              loading={processing}
            >
              Approve Listing
            </Button>

            <Button
              variant="danger"
              icon={<XCircle size={15} />}
              onClick={() => setRejectModalOpen(true)}
              disabled={processing}
              className="px-5"
            >
              Reject Listing
            </Button>

            <Button
              className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white px-5 flex items-center gap-1.5"
              onClick={() => setChangesModalOpen(true)}
              disabled={processing}
            >
              <AlertTriangle size={15} /> Request Changes
            </Button>

            <Button
              className="bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white px-5 flex items-center gap-1.5"
              onClick={() => setSuspendModalOpen(true)}
              loading={processing}
            >
              <Lock size={15} /> Suspend Listing
            </Button>

          </div>
        </div>

        {/* Rejection modal */}
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => { setRejectModalOpen(false); setRejectReason(''); }}
          title="Reject Listing"
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">Provide a clear reason for rejecting the listing "{listing.title}". This message will be sent directly to the seller.</p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Prohibited item, misleading images, incorrect category..."
              rows={4}
              required
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setRejectModalOpen(false); setRejectReason(''); }}>Cancel</Button>
              <Button variant="danger" onClick={handleReject} loading={processing}>Confirm Reject</Button>
            </div>
          </div>
        </Modal>

        {/* Request changes modal */}
        <Modal
          isOpen={changesModalOpen}
          onClose={() => { setChangesModalOpen(false); setChangesReason(''); }}
          title="Request Changes"
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">Provide detailed instructions on what changes the user needs to make to their listing "{listing.title}" before it can be approved.</p>
            <Textarea
              value={changesReason}
              onChange={(e) => setChangesReason(e.target.value)}
              placeholder="e.g. Please upload higher quality photos of the model serial number and clarify the condition details in the description."
              rows={4}
              required
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setChangesModalOpen(false); setChangesReason(''); }}>Cancel</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleRequestChanges} loading={processing}>Send Requests</Button>
            </div>
          </div>
        </Modal>

        {/* Suspend Listing modal */}
        <Modal
          isOpen={suspendModalOpen}
          onClose={() => { setSuspendModalOpen(false); setSuspensionReason(''); }}
          title="Suspend Listing"
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">Provide a clear reason for suspending the listing "{listing.title}". This action will notify the seller and mark the listing as suspended.</p>
            <Textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="e.g. Repeated safety policy violations, prohibited services/items, suspicious seller activity..."
              rows={4}
              required
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setSuspendModalOpen(false); setSuspensionReason(''); }}>Cancel</Button>
              <Button variant="danger" onClick={handleSuspend} loading={processing}>Confirm Suspend</Button>
            </div>
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

// ============================================================
// INDEPENDENT MODERATOR PERFORMANCE ANALYTICS PAGE
// ============================================================
export const ModeratorPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'lifetime'>('lifetime');
  
  const [listings, setListings] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const fetchPerformanceData = async () => {
    if (!user) return;
    try {
      const [listingsRes, reportsRes] = await Promise.all([
        supabase
          .from('listings')
          .select('status, moderated_at, moderated_by, category:categories!listings_category_id_fkey(name)')
          .eq('moderated_by', user.id),
        supabase
          .from('reports')
          .select('*')
          .eq('moderator_id', user.id)
          .neq('status', 'pending')
      ]);

      if (listingsRes.error) throw listingsRes.error;
      if (reportsRes.error) throw reportsRes.error;

      setListings(listingsRes.data || []);
      setReports(reportsRes.data || []);
    } catch (err) {
      console.error('Error fetching performance analytics:', err);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();

    // Realtime subscriptions
    const listingsChannel = supabase
      .channel('mod-performance-listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
        fetchPerformanceData();
      })
      .subscribe();

    const reportsChannel = supabase
      .channel('mod-performance-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchPerformanceData();
      })
      .subscribe();

    return () => {
      listingsChannel.unsubscribe();
      reportsChannel.unsubscribe();
    };
  }, [user]);

  // Compute stats based on the selected period
  const getFilteredStats = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let filteredListings = listings;
    let filteredReports = reports;

    if (period === 'today') {
      filteredListings = listings.filter(l => l.moderated_at && new Date(l.moderated_at) >= startOfToday);
      filteredReports = reports.filter(r => r.updated_at && new Date(r.updated_at) >= startOfToday);
    } else if (period === 'week') {
      filteredListings = listings.filter(l => l.moderated_at && new Date(l.moderated_at) >= startOfWeek);
      filteredReports = reports.filter(r => r.updated_at && new Date(r.updated_at) >= startOfWeek);
    } else if (period === 'month') {
      filteredListings = listings.filter(l => l.moderated_at && new Date(l.moderated_at) >= startOfMonth);
      filteredReports = reports.filter(r => r.updated_at && new Date(r.updated_at) >= startOfMonth);
    }

    let approved = 0;
    let rejected = 0;
    let changes = 0;
    let suspended = 0;
    const categoryCounts: Record<string, number> = {};

    filteredListings.forEach(l => {
      if (l.status === 'active' || l.status === 'sold') approved++;
      else if (l.status === 'rejected') rejected++;
      else if (l.status === 'changes_requested') changes++;
      else if (l.status === 'suspended') suspended++;

      const catName = l.category?.name || 'General';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    });

    const resolvedReports = filteredReports.length;
    const reviewed = approved + rejected + changes + suspended;

    return {
      reviewed,
      approved,
      rejected,
      changes,
      suspended,
      resolvedReports,
      categoryCounts: Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])
    };
  };

  const stats = getFilteredStats();

  return (
    <DashboardLayout navItems={moderatorNav} title="My Performance Analytics">
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">My Performance</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Independent stats and analytics for your personal moderator achievements
            </p>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            {(['today', 'week', 'month', 'lifetime'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
                  period === p ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard title="Listings Reviewed" value={stats.reviewed} icon={<CheckCircle size={20} />} color="orange" />
              <StatCard title="Listings Approved" value={stats.approved} icon={<CheckSquare size={20} />} color="green" />
              <StatCard title="Listings Rejected" value={stats.rejected} icon={<XCircle size={20} />} color="red" />
              <StatCard title="Changes Requested" value={stats.changes} icon={<AlertTriangle size={20} />} color="orange" />
              <StatCard title="Listings Suspended" value={stats.suspended} icon={<Lock size={20} />} color="slate" />
              <StatCard title="Reports Resolved" value={stats.resolvedReports} icon={<Flag size={20} />} color="purple" />
            </div>

            {/* Bottom Row Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
              {/* Category distribution */}
              <div className="card p-5 lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-2">
                  <Package size={18} className="text-primary-500" /> Category Breakdown
                </h3>
                {stats.categoryCounts.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-12">No categorized actions in this period</p>
                ) : (
                  <div className="space-y-3.5">
                    {stats.categoryCounts.map(([name, count]) => {
                      const percentage = stats.reviewed > 0 ? (count / stats.reviewed) * 100 : 0;
                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                            <span>{name}</span>
                            <span className="font-mono">{count} reviews ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Achievement Summary Card */}
              <div className="card p-5 bg-gradient-to-b from-primary-500/5 to-surface flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b pb-2">
                    <Sparkles size={18} className="text-amber-500" /> Moderator Scorecard
                  </h3>
                  <div className="mt-4 space-y-4 text-sm text-slate-650 dark:text-slate-350">
                    <p className="leading-relaxed">
                      You are logged in as <strong className="text-slate-800 dark:text-slate-100 font-semibold capitalize">{user?.full_name}</strong>. Your work keeps our community secure and clean.
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs border-b border-dashed py-1.5">
                        <span>Approvals to Rejections Ratio:</span>
                        <span className="font-mono font-semibold text-slate-850 dark:text-slate-100">
                          {stats.rejected > 0 ? (stats.approved / stats.rejected).toFixed(1) : stats.approved} : 1
                        </span>
                      </div>
                      <div className="flex justify-between text-xs border-b border-dashed py-1.5">
                        <span>Quality Flag Rate:</span>
                        <span className="font-mono font-semibold text-slate-850 dark:text-slate-100">
                          {stats.reviewed > 0 ? ((stats.rejected + stats.changes + stats.suspended) / stats.reviewed * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Independent Moderator Performance tracking active</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// ============================================================
// REPORT REVIEW PAGE (same-tab detailed view)
// ============================================================
export const ReportReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Report['status'] | null>(null);

  // Messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const reports = await reportsService.getReports();
        const found = reports.find(r => r.id === id);
        if (found) {
          setReport(found);
        } else {
          toast.error('Report not found');
          navigate('/moderator/reports');
        }
      } catch {
        toast.error('Failed to load report');
        navigate('/moderator/reports');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id, navigate]);

  // Load or create conversation with the seller
  useEffect(() => {
    const initConversation = async () => {
      if (!report?.listing || !user) return;
      const sellerId = report.listing.seller_id;
      const listingId = report.listing_id;
      if (!sellerId || sellerId === user.id) return;
      
      setLoadingMessages(true);
      try {
        const convId = await chatService.getOrCreateConversation(listingId, user.id, sellerId);
        setConversationId(convId);
        const msgs = await chatService.getMessages(convId);
        setMessages(msgs);
      } catch {
        // Conversation may not exist yet, that's okay
      } finally {
        setLoadingMessages(false);
      }
    };
    initConversation();
  }, [report, user]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;
    const channel = chatService.subscribeToMessages(conversationId, (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => { channel.unsubscribe(); };
  }, [conversationId]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !conversationId) return;
    setSendingMessage(true);
    try {
      await chatService.sendMessage(conversationId, user.id, messageText.trim());
      setMessageText('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleResolveWithNote = async () => {
    if (!report || !pendingStatus) return;
    setProcessing(true);
    try {
      await reportsService.updateReport(report.id, {
        status: pendingStatus,
        moderator_id: user?.id,
        resolution_note: resolutionNote || undefined,
      });

      // If resolving, optionally suspend the listing
      if (pendingStatus === 'resolved' && report.listing) {
        await listingsService.updateListing(report.listing_id, {
          status: 'suspended',
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
          attributes: {
            ...report.listing.attributes,
            suspension_reason: resolutionNote || 'Violated content safety policy'
          }
        });

        await notificationsService.createNotification({
          user_id: report.listing.seller_id,
          type: 'listing_status',
          title: 'Listing Suspended',
          message: `Your listing "${report.listing.title}" was suspended after a report review.${resolutionNote ? ` Note: ${resolutionNote}` : ''}`,
          is_read: false,
          data: { listing_id: report.listing_id },
        });

        if (user) {
          await sendSystemMessage(report.listing, user.id, `Your listing "${report.listing.title}" has been suspended due to safety policy violations. Reason: ${resolutionNote || 'Violated content safety policy'}`);
        }
      }

      setReport(prev => prev ? { ...prev, status: pendingStatus, moderator_id: user?.id } : null);
      toast.success(`Report ${pendingStatus}`);
      setNoteModalOpen(false);
      setResolutionNote('');
      setPendingStatus(null);
    } catch {
      toast.error('Failed to update report');
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickAction = (status: Report['status']) => {
    setPendingStatus(status);
    setNoteModalOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout navItems={moderatorNav} title="Report Review">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!report || !report.listing) {
    return (
      <DashboardLayout navItems={moderatorNav} title="Report Review">
        <div className="max-w-4xl mx-auto text-center py-12">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Report Not Found</h2>
          <Button className="mt-4" onClick={() => navigate('/moderator/reports')}>Back to Reports</Button>
        </div>
      </DashboardLayout>
    );
  }

  const listing = report.listing;
  const catHierarchy = [
    listing.category?.name,
    listing.attributes?.subcategory_name,
    listing.attributes?.sub_subcategory_name,
  ].filter(Boolean).join(' › ');

  return (
    <DashboardLayout navItems={moderatorNav} title="Report Review">
      <div className="max-w-6xl mx-auto space-y-6 pb-24">

        {/* Back button & status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/moderator/reports')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors w-fit"
          >
            <ArrowLeft size={16} /> Back to Reports
          </button>
          <div className="flex items-center gap-2">
            <Badge variant={report.status === 'pending' ? 'warning' : report.status === 'resolved' ? 'success' : 'info'} className="capitalize">
              Report: {report.status}
            </Badge>
            <Badge variant={listing.status === 'active' ? 'success' : listing.status === 'suspended' ? 'default' : 'warning'} className="capitalize">
              Listing: {listing.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {/* Report Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/10"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-950/40 rounded-xl flex items-center justify-center text-red-500 shrink-0">
              <Flag size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Report Details</h2>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 shrink-0">Reason:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{report.reason}</span>
                </div>
                {report.description && (
                  <div className="text-sm">
                    <span className="text-slate-500">Description: </span>
                    <span className="text-slate-700 dark:text-slate-300">{report.description}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <UserIcon size={12} /> Reported by: <strong className="text-slate-600 dark:text-slate-300">{report.reporter?.full_name}</strong>
                  </span>
                  <span>
                    <Clock size={12} className="inline mr-1" />{formatDate(report.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Listing Title */}
        <div className="card p-5 bg-gradient-to-r from-amber-500/10 to-surface">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{listing.title}</h1>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
            <Tag size={13} className="text-slate-400" /> {catHierarchy || 'General Category'}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Listing Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Image Gallery */}
            {listing.images && listing.images.length > 0 && (
              <div className="card overflow-hidden">
                <ImageGallery images={listing.images} videoUrl={listing.video_url} title={listing.title} />
              </div>
            )}

            {/* Description */}
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b pb-2">Description</h2>
              <p className="text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line text-sm">
                {listing.description}
              </p>
            </div>

            {/* Specifications */}
            {listing.attributes && Object.keys(listing.attributes).length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 border-b pb-2">Listing Specifications</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(listing.attributes).map(([key, value]) => {
                    if (!value || ignoredKeys.has(key.toLowerCase())) return null;
                    const formattedKey = key
                      .replace(/_/g, ' ')
                      .replace(/-/g, ' ')
                      .replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <div key={key} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{formattedKey}</span>
                        <p className="font-medium text-sm text-slate-850 dark:text-slate-200 capitalize mt-1">{value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Seller, Price, and Messaging */}
          <div className="space-y-6">

            {/* Price Card */}
            {!isPricingDisabled(listing) && (
              <div className="card p-5 bg-primary-950/5 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 text-center">
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Listing Price</span>
                <p className="text-3xl font-extrabold text-primary-600 dark:text-primary-400 mt-1">{formatPrice(listing.price)}</p>
                {listing.is_negotiable && (
                  <Badge variant="success" className="mt-2.5 mx-auto w-fit">Price Negotiable</Badge>
                )}
              </div>
            )}

            {/* Seller Profile Card */}
            <div className="card p-5">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 border-b pb-2 flex items-center gap-2">
                <UserIcon size={16} className="text-slate-400" /> Seller Profile
              </h3>
              <div className="flex items-center gap-3">
                <img
                  src={listing.seller?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150'}
                  alt=""
                  className="w-12 h-12 object-cover rounded-full bg-slate-100 dark:bg-slate-800 border"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {listing.seller?.full_name}
                  </p>
                  <Badge variant={listing.seller?.is_verified ? 'success' : 'default'} className="text-[9px] px-1 py-0 scale-95">
                    {listing.seller?.is_verified ? 'Verified Seller' : 'Standard Account'}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-slate-500 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span>Email:</span>
                  <span className="text-slate-700 dark:text-slate-350 select-all font-mono">{listing.seller?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phone:</span>
                  <span className="text-slate-700 dark:text-slate-350 select-all font-mono">{listing.seller?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>City:</span>
                  <span className="text-slate-700 dark:text-slate-350 capitalize font-medium">{listing.city}</span>
                </div>
              </div>
            </div>

            {/* Moderator → Seller Messaging Panel */}
            <div className="card overflow-hidden flex flex-col" style={{ maxHeight: 420 }}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 shrink-0">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MessageSquare size={15} className="text-primary-500" /> Message Seller
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Communicate with {listing.seller?.full_name || 'the seller'} about this listing</p>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[140px] bg-slate-25 dark:bg-slate-900/30">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                    <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={24} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No messages yet. Start a conversation with the seller.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSystem = msg.sender?.role === 'moderator' || msg.sender?.role === 'admin' || msg.sender?.role === 'super_admin';
                    const isMe = msg.sender_id === user?.id;

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-start w-full mb-3">
                          <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50/20 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-3 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1 border-b border-blue-100/50 dark:border-blue-900/10 pb-1">
                              <span className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <Shield size={10} />
                              </span>
                              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">All in One</span>
                              <span className="text-[8px] px-1 py-0.5 bg-blue-600 text-white rounded font-bold uppercase tracking-wider shrink-0 scale-90">
                                System / Admin
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-line">
                              {msg.content}
                            </p>
                            <span className="text-[9px] text-slate-450 dark:text-slate-400 mt-1 block text-right">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={cn(
                          'max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
                          isMe
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
                        )}>
                          <p>{msg.content}</p>
                          <span className={cn(
                            'text-[9px] mt-1 block',
                            isMe ? 'text-white/60' : 'text-slate-400'
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder="Type a message..."
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-slate-700 dark:text-slate-200 placeholder-slate-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage || !conversationId}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    {sendingMessage ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        {report.status === 'pending' && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-center gap-3 z-40">
            <div className="flex flex-wrap justify-center gap-3 max-w-5xl w-full px-4">
              <Button
                variant="secondary"
                icon={<ArrowLeft size={15} />}
                onClick={() => navigate('/moderator/reports')}
                disabled={processing}
                className="px-4"
              >
                Back
              </Button>
              <Button
                variant="secondary"
                icon={<Eye size={15} />}
                onClick={() => handleQuickAction('reviewed')}
                disabled={processing}
                className="px-5"
              >
                Mark Reviewed
              </Button>
              <Button
                variant="danger"
                icon={<CheckCircle size={15} />}
                onClick={() => handleQuickAction('resolved')}
                disabled={processing}
                className="px-5"
              >
                Resolve & Suspend Listing
              </Button>
              <Button
                variant="ghost"
                icon={<XCircle size={15} />}
                onClick={() => handleQuickAction('dismissed')}
                disabled={processing}
                className="px-5"
              >
                Dismiss Report
              </Button>
            </div>
          </div>
        )}

        {/* Resolution note modal */}
        <Modal
          isOpen={noteModalOpen}
          onClose={() => { setNoteModalOpen(false); setResolutionNote(''); setPendingStatus(null); }}
          title={`${pendingStatus === 'reviewed' ? 'Mark as Reviewed' : pendingStatus === 'resolved' ? 'Resolve Report' : 'Dismiss Report'}`}
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">
              {pendingStatus === 'resolved'
                ? 'This will resolve the report and suspend the listing. Add an optional note.'
                : pendingStatus === 'reviewed'
                ? 'Mark this report as reviewed. You can add an optional note.'
                : 'Dismiss this report. Add an optional note explaining why.'}
            </p>
            <Textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Optional resolution note..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setNoteModalOpen(false); setResolutionNote(''); setPendingStatus(null); }}>Cancel</Button>
              <Button
                variant={pendingStatus === 'resolved' ? 'danger' : 'primary'}
                onClick={handleResolveWithNote}
                loading={processing}
              >
                {pendingStatus === 'reviewed' ? 'Mark Reviewed' : pendingStatus === 'resolved' ? 'Resolve & Suspend' : 'Dismiss'}
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </DashboardLayout>
  );
};

// ============================================================
// MODERATOR MESSAGES & BROADCAST PAGE
// ============================================================


export const ModeratorMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'chats' | 'users'>('chats');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Chat window states
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Broadcast modal states
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastCategory, setBroadcastCategory] = useState<'platform_update' | 'maintenance' | 'new_feature' | 'safety_warning' | 'campaign' | 'notice'>('notice');
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastTotal, setBroadcastTotal] = useState(0);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const showActiveListingContext = (() => {
    if (!selectedConversation) return false;
    if (!selectedConversation.listing) return false;
    return selectedConversation.listing.title !== 'All in One System';
  })();

  // Fetch initial conversations and users list
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        const [convs, members] = await Promise.all([
          chatService.getConversations(user.id),
          usersService.getAllUsers()
        ]);
        setConversations(convs);
        const regularUsers = members.filter(u => 
          u.id !== user.id && 
          (u.role === 'buyer' || u.role === 'seller') &&
          !u.roles.includes('moderator') && 
          !u.roles.includes('admin') && 
          !u.roles.includes('super_admin')
        );
        setAllUsers(regularUsers);
      } catch {
        toast.error('Failed to load dashboard messages data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    // Subscribe to new conversations real-time
    const channel = chatService.subscribeToConversations(user.id, () => {
      chatService.getConversations(user.id).then(setConversations).catch(console.error);
    });
    
    return () => { channel.unsubscribe(); };
  }, [user]);

  // Load message logs of the selected chat
  useEffect(() => {
    setMessages([]); // Clear messages immediately to avoid state leakage from previous conversation
    if (!selectedConversation) return;
    
    setLoadingMessages(true);
    chatService.getMessages(selectedConversation.id)
      .then(setMessages)
      .catch(() => toast.error('Failed to fetch message logs'))
      .finally(() => setLoadingMessages(false));
  }, [selectedConversation]);

  // Real-time message subscription for currently active conversation
  useEffect(() => {
    if (!selectedConversation) return;
    
    const channel = chatService.subscribeToMessages(selectedConversation.id, (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      
      // Update unread badges
      if (user) {
        chatService.markMessagesRead(selectedConversation.id, user.id).catch(console.error);
      }
    });

    return () => { channel.unsubscribe(); };
  }, [selectedConversation, user]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !selectedConversation) return;
    setSendingMessage(true);
    try {
      const msg = await chatService.sendMessage(selectedConversation.id, user.id, messageText.trim());
      setMessages(prev => [...prev, msg]);
      setMessageText('');
    } catch {
      toast.error('Failed to dispatch message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Helper to resolve or create the placeholder system listing for general/broadcast messages
  const getOrCreateSystemListing = async (moderatorId: string) => {
    try {
      const { data: existing } = await supabase
        .from('listings')
        .select('id')
        .eq('title', 'All in One System')
        .limit(1);
        
      if (existing && existing.length > 0) {
        return existing[0].id;
      }
      
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .limit(1);
        
      const categoryId = categories?.[0]?.id;
      if (!categoryId) return null;
      
      const { data: created, error } = await supabase
        .from('listings')
        .insert({
          title: 'All in One System',
          description: 'System Notifications and Updates',
          price: 0,
          currency: 'PKR',
          category_id: categoryId,
          seller_id: moderatorId,
          status: 'active',
          condition: 'new',
          images: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150'],
          location: 'Pakistan',
          city: 'Pakistan',
          country: 'Pakistan',
          is_featured: false,
          is_negotiable: false
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Error inserting system listing placeholder:', error);
        return null;
      }
      return created.id;
    } catch (err) {
      console.error('System listing routine failed:', err);
      return null;
    }
  };

  // Open or initiate a chat with a specific user
  const handleOpenUserChat = async (targetUser: User) => {
    if (!user) return;
    setLoadingMessages(true);
    
    try {
      const systemListingId = await getOrCreateSystemListing(user.id);
      if (!systemListingId) {
        toast.error('Failed to initialize system notification channel');
        setLoadingMessages(false);
        return;
      }

      const convId = await chatService.getOrCreateConversation(systemListingId, user.id, targetUser.id);
      
      // Refresh list to pull the conversation detail
      const refreshedConvs = await chatService.getConversations(user.id);
      setConversations(refreshedConvs);
      
      const matched = refreshedConvs.find(c => c.id === convId);
      if (matched) {
        setSelectedConversation(matched);
      } else {
        // Fallback mockup object
        setSelectedConversation({
          id: convId,
          listing_id: systemListingId,
          buyer_id: user.id,
          seller_id: targetUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          buyer: user,
          seller: targetUser
        });
      }
      
      setCurrentTab('chats');
    } catch {
      toast.error('Failed to initiate conversation with user');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Broadcast Message to all registered users in parallel
  const handleSendBroadcast = async () => {
    if (!broadcastText.trim() || !user) return;
    setIsBroadcasting(true);
    setBroadcastProgress(0);
    
    try {
      const allMembers = await usersService.getAllUsers();
      const recipients = allMembers.filter(u => 
        u.id !== user.id && 
        (u.role === 'buyer' || u.role === 'seller') &&
        !u.roles.includes('moderator') && 
        !u.roles.includes('admin') && 
        !u.roles.includes('super_admin')
      );
      setBroadcastTotal(recipients.length);

      let successCount = 0;
      
      const systemListingId = await getOrCreateSystemListing(user.id);
      if (!systemListingId) {
        toast.error('Broadcast failed: Could not resolve system context.');
        setIsBroadcasting(false);
        return;
      }

      const formattedCategory = broadcastCategory.replace(/_/g, ' ').toUpperCase();
      const payloadText = `[Broadcast Alert - ${formattedCategory}]\n${broadcastText.trim()}`;

      // Iterate through recipients
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        try {
          const convId = await chatService.getOrCreateConversation(systemListingId, user.id, recipient.id);
          await chatService.sendMessage(convId, user.id, payloadText);
          successCount++;
        } catch (err) {
          console.error(`Broadcast failed for user ID ${recipient.id}:`, err);
        }
        setBroadcastProgress(i + 1);
      }

      toast.success(`Broadcast announcement successfully dispatched to ${successCount} users!`);
      setBroadcastModalOpen(false);
      setBroadcastText('');
      
      // Refresh current chats
      const refreshedConvs = await chatService.getConversations(user.id);
      setConversations(refreshedConvs);
    } catch {
      toast.error('Failed to execute broadcast notification routine');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Filter computations
  const filteredChats = conversations.filter(conv => {
    const other = user?.id === conv.buyer_id ? conv.seller : conv.buyer;
    return other?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredUsers = allUsers.filter(u => {
    const q = searchQuery.toLowerCase();
    return u.full_name?.toLowerCase().includes(q) ||
           u.email?.toLowerCase().includes(q) ||
           u.phone?.toLowerCase().includes(q);
  });

  const otherChatUser = selectedConversation
    ? (user?.id === selectedConversation.buyer_id ? selectedConversation.seller : selectedConversation.buyer)
    : null;

  return (
    <DashboardLayout navItems={moderatorNav} title="Moderator Workspace Messages">
      <div className="flex h-[calc(100vh-10rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden relative">
        
        {/* Left Side: Navigation Sidebar & User search */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-900/60">
          
          <div className="p-4 border-b border-slate-200 dark:border-slate-850 shrink-0 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base">Communications</h2>
              <Button
                size="xs"
                variant="primary"
                onClick={() => setBroadcastModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Broadcast
              </Button>
            </div>
            
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={currentTab === 'chats' ? "Search conversations..." : "Search users by name, email..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700 dark:text-slate-200 placeholder-slate-400"
              />
            </div>

            {/* Selector Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => { setCurrentTab('chats'); setSearchQuery(''); }}
                className={cn(
                  "flex-1 py-1.5 rounded-md transition-all",
                  currentTab === 'chats' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500"
                )}
              >
                Chats ({filteredChats.length})
              </button>
              <button
                onClick={() => { setCurrentTab('users'); setSearchQuery(''); }}
                className={cn(
                  "flex-1 py-1.5 rounded-md transition-all",
                  currentTab === 'users' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500"
                )}
              >
                Directory ({filteredUsers.length})
              </button>
            </div>
          </div>

          {/* Directory Listings / Active Chats scroll region */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : currentTab === 'chats' ? (
              filteredChats.length === 0 ? (
                <p className="text-xs text-slate-400 py-12 text-center">No active chats found</p>
              ) : (
                filteredChats.map(conv => {
                  const other = user?.id === conv.buyer_id ? conv.seller : conv.buyer;
                  const isSelected = selectedConversation?.id === conv.id;
                  const isSystemConv = other?.role === 'moderator' || other?.role === 'admin' || other?.role === 'super_admin';
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all border-b border-slate-200/50 dark:border-slate-800/40 flex items-center gap-3",
                        isSelected && "bg-primary-50 dark:bg-primary-950/20"
                      )}
                    >
                      {isSystemConv ? (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                          <Shield size={16} />
                        </div>
                      ) : (
                        <Avatar src={other?.avatar_url} name={other?.full_name || ''} size="sm" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
                            {isSystemConv ? 'All in One' : other?.full_name}
                            {isSystemConv && <span className="text-[8px] bg-blue-600 text-white px-1 rounded font-bold uppercase">System</span>}
                          </p>
                          <span className="text-[9px] text-slate-400">
                            {conv.last_message && formatDate(conv.last_message.created_at)}
                          </span>
                        </div>
                        {conv.listing && conv.listing.title !== 'All in One System' && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">Re: {conv.listing.title}</p>
                        )}
                        {conv.last_message && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-450 truncate mt-0.5">{conv.last_message.content}</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              filteredUsers.length === 0 ? (
                <p className="text-xs text-slate-400 py-12 text-center">No users match your criteria</p>
              ) : (
                filteredUsers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleOpenUserChat(member)}
                    className="w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all border-b border-slate-200/50 dark:border-slate-800/40 flex items-center gap-3"
                  >
                    <Avatar src={member.avatar_url} name={member.full_name || ''} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{member.full_name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                      {member.phone && <p className="text-[9px] text-slate-500 font-mono mt-0.5">{member.phone}</p>}
                    </div>
                  </button>
                ))
              )
            )}
          </div>

        </div>

        {/* Center/Right Panel: Chat window workspace */}
        <div className="flex-1 flex flex-col bg-slate-25 dark:bg-slate-900/10">
          {selectedConversation ? (
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              
              {/* Active Conversation header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar src={otherChatUser?.avatar_url} name={otherChatUser?.full_name || ''} size="sm" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{otherChatUser?.full_name}</h3>
                    <p className="text-[10px] text-slate-400">{otherChatUser?.email}</p>
                  </div>
                </div>
                {selectedConversation.listing && showActiveListingContext && (
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-[10px] text-slate-500 border border-slate-100 dark:border-slate-700 max-w-xs truncate">
                    Re: {selectedConversation.listing.title}
                  </div>
                )}
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-25 dark:bg-slate-950/20">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">
                    <Spinner className="mr-2" /> Loading conversations history...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                    <MessageSquare size={32} className="text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
                    <p className="text-xs">Send an official moderator message to start communications.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSystem = msg.sender?.role === 'moderator' || msg.sender?.role === 'admin' || msg.sender?.role === 'super_admin';
                    const isMe = msg.sender_id === user?.id;

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-start w-full">
                          <div className="w-full max-w-[85%] bg-gradient-to-r from-blue-50 to-indigo-50/20 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm relative">
                            <div className="flex items-center gap-1.5 mb-1.5 border-b border-blue-100/50 dark:border-blue-900/10 pb-1 shrink-0">
                              <span className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <Shield size={10} />
                              </span>
                              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">All in One</span>
                              <span className="text-[8px] px-1 py-0.5 bg-blue-600 text-white rounded font-bold uppercase shrink-0 scale-90">
                                System / Admin
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                              {msg.content}
                            </p>
                            <span className="text-[9px] text-slate-450 dark:text-slate-500 mt-2 block text-right">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm",
                          isMe 
                            ? "bg-primary-600 text-white rounded-br-none" 
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none"
                        )}>
                          <p>{msg.content}</p>
                          <span className={cn("text-[9px] block mt-1.5 text-right", isMe ? "text-white/60" : "text-slate-400")}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message inputs block */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type official notification message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700 dark:text-slate-200 placeholder-slate-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                    className="w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center disabled:opacity-40 shrink-0 shadow-sm transition-all"
                  >
                    {sendingMessage ? <Spinner className="w-3.5 h-3.5 border-white" /> : <Send size={15} />}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-inner mb-4">
                <MessageSquare size={28} />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">All in One Communications Portal</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Select a user chat or search users directory from the left sidebar to start messaging. You can broadcast platform-wide announcements.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Broadcast Message Modal */}
      <Modal
        isOpen={broadcastModalOpen}
        onClose={() => { if (!isBroadcasting) { setBroadcastModalOpen(false); setBroadcastText(''); } }}
        title="Broadcast System Notification"
      >
        <div className="space-y-4 py-2">
          {isBroadcasting ? (
            <div className="space-y-3.5 py-4 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sending platform broadcast announcement...</p>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden max-w-sm mx-auto">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${(broadcastProgress / broadcastTotal) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Progress: {broadcastProgress} / {broadcastTotal} users notified</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                This will dispatch a real-time system message to <strong>every registered user</strong> on the platform. It will arrive as a read-only message from <strong>All in One</strong>.
              </p>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Announcement Category</label>
                <select
                  value={broadcastCategory}
                  onChange={(e) => setBroadcastCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="notice">📢 Important Notice / Update</option>
                  <option value="platform_update">⚙️ Platform Core Update</option>
                  <option value="maintenance">🛠️ Scheduled Maintenance</option>
                  <option value="new_feature">🚀 New Feature Release</option>
                  <option value="safety_warning">⚠️ Security & Safety Warning</option>
                  <option value="campaign">🎁 Promotional & Campaign Notice</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Message Content</label>
                <Textarea
                  placeholder="Type broadcast announcement text details here..."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-800">
                <Button variant="secondary" size="sm" onClick={() => setBroadcastModalOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold"
                  onClick={handleSendBroadcast}
                  disabled={!broadcastText.trim()}
                >
                  Send Announcement
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
};

