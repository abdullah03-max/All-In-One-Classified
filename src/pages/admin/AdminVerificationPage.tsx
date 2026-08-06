import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Shield, CheckCircle, XCircle, Clock, Calendar, Phone, MapPin, Search, Eye, Download, Info, Trash2, ArrowLeft, ExternalLink, RefreshCw
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, Badge, Button, Skeleton, Modal } from '../../components/ui';
import { verificationService, notificationsService } from '../../services';
import { VerificationApplication, User } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const adminNav = [
  { label: 'Overview', icon: 'LayoutDashboard', to: '/admin' },
  { label: 'Listings', icon: 'Package', to: '/admin/listings' },
  { label: 'Users', icon: 'Users', to: '/admin/users' },
  { label: 'Verification Applications', icon: 'UserCheck', to: '/admin/verifications' },
  { label: 'Payments', icon: 'CreditCard', to: '/admin/payments' },
  { label: 'Categories', icon: 'Tag', to: '/admin/categories' },
  { label: 'Moderators', icon: 'Shield', to: '/admin/moderators' },
  { label: 'Analytics', icon: 'BarChart2', to: '/admin/analytics' },
  { label: 'Settings', icon: 'Settings', to: '/profile' },
];

export const AdminVerificationPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [applications, setApplications] = useState<VerificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Preview state
  const [selectedApp, setSelectedApp] = useState<VerificationApplication | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Load applications
  const loadApps = async () => {
    try {
      const data = await verificationService.getAllApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load verification applications:', err);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();

    // Subscribe to real-time changes
    const channel = verificationService.subscribeToApplications((payload) => {
      loadApps(); // Reload application list to pull populated user info too
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleApprove = async (app: VerificationApplication) => {
    if (!currentAdmin) return;
    setUpdating(true);
    try {
      await verificationService.updateApplicationStatus(app.id, app.user_id, 'approved');
      
      // Send real-time system notification
      await notificationsService.createNotification({
        user_id: app.user_id,
        type: 'system',
        title: 'Account Verified',
        message: 'Congratulations! Your account has been verified successfully.',
        is_read: false,
      });

      toast.success('Application approved. User is now verified.');
      setSelectedApp(null);
    } catch (err: any) {
      toast.error(err?.message || 'Approval failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !currentAdmin) return;
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }

    setUpdating(true);
    try {
      await verificationService.updateApplicationStatus(selectedApp.id, selectedApp.user_id, 'rejected', rejectionReason.trim());
      
      // Send real-time system notification
      await notificationsService.createNotification({
        user_id: selectedApp.user_id,
        type: 'system',
        title: 'Verification Request Rejected',
        message: `Your account verification application was rejected. Reason: ${rejectionReason.trim()}`,
        is_read: false,
      });

      toast.success('Application rejected.');
      setRejectModalOpen(false);
      setRejectionReason('');
      setSelectedApp(null);
    } catch (err: any) {
      toast.error(err?.message || 'Rejection failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadImage = (url: string, filename: string) => {
    // Basic image download trigger
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobURL = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobURL);
      })
      .catch(() => {
        // Fallback open in new tab
        window.open(url, '_blank');
      });
  };

  // Filter application list
  const filtered = applications.filter(app => {
    const statusMatches = statusFilter === 'all' || app.status === statusFilter;
    const query = search.toLowerCase();
    const searchMatches =
      !search ||
      app.full_name.toLowerCase().includes(query) ||
      (app.user?.email || '').toLowerCase().includes(query) ||
      app.cnic_number.includes(query) ||
      app.phone.includes(query);
    return statusMatches && searchMatches;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="error">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const formatDateString = (ts: string) => {
    try {
      return format(new Date(ts), 'PPP');
    } catch {
      return ts;
    }
  };

  return (
    <DashboardLayout navItems={adminNav} title="Verification Applications">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Verification Applications</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review and verify user identities (KYC documents).</p>
          </div>
          <Button onClick={loadApps} variant="outline" className="flex items-center gap-1">
            <RefreshCw size={15} />
            Refresh
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full md:max-w-xl">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone or CNIC..."
              className="input pl-9"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl capitalize transition-all border ${
                  statusFilter === tab
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="card overflow-hidden border border-slate-200 dark:border-slate-800/80">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left p-3 font-medium text-slate-500">Applicant</th>
                    <th className="text-left p-3 font-medium text-slate-500">CNIC Number</th>
                    <th className="text-left p-3 font-medium text-slate-500">Phone</th>
                    <th className="text-left p-3 font-medium text-slate-500">City</th>
                    <th className="text-left p-3 font-medium text-slate-500">Submitted</th>
                    <th className="text-left p-3 font-medium text-slate-500">Status</th>
                    <th className="text-right p-3 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => (
                    <tr key={app.id} className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{app.full_name}</p>
                          <p className="text-xs text-slate-500">{app.user?.email}</p>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs">{app.cnic_number}</td>
                      <td className="p-3 text-xs text-slate-500">{app.phone}</td>
                      <td className="p-3 text-xs text-slate-500">{app.city}</td>
                      <td className="p-3 text-xs text-slate-500">{formatDateString(app.created_at)}</td>
                      <td className="p-3">{getStatusBadge(app.status)}</td>
                      <td className="p-3 text-right">
                        <Button
                          onClick={() => setSelectedApp(app)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 ml-auto text-xs"
                        >
                          <Eye size={12} />
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                No applications found under this filter criteria.
              </div>
            )}
          </div>
        )}

        {/* Detailed Application Review Modal */}
        {selectedApp && (
          <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} size="full" className="max-w-4xl">
            <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Review Identity Verification</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Submitted by user ID: {selectedApp.user_id}</p>
                </div>
                {getStatusBadge(selectedApp.status)}
              </div>

              {/* Applicant Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Full Name</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedApp.full_name}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">CNIC Number</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">{selectedApp.cnic_number}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Date of Birth</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedApp.dob}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Phone</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedApp.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">City</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedApp.city}</p>
                </div>
                <div className="md:col-span-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Address</span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selectedApp.address || 'N/A'}</p>
                </div>
              </div>

              {/* Document Images */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Verification Files</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CNIC Front */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/40">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">CNIC Front</span>
                      <button
                        onClick={() => handleDownloadImage(selectedApp.cnic_front_url, `${selectedApp.full_name}_cnic_front.jpg`)}
                        className="p-1 hover:text-blue-500 transition-colors"
                        title="Download Front Image"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                    <a href={selectedApp.cnic_front_url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[3/2] overflow-hidden group">
                      <img src={selectedApp.cnic_front_url} alt="CNIC Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ExternalLink size={20} className="text-white" />
                      </div>
                    </a>
                  </div>

                  {/* CNIC Back */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/40">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">CNIC Back</span>
                      <button
                        onClick={() => handleDownloadImage(selectedApp.cnic_back_url, `${selectedApp.full_name}_cnic_back.jpg`)}
                        className="p-1 hover:text-blue-500 transition-colors"
                        title="Download Back Image"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                    <a href={selectedApp.cnic_back_url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[3/2] overflow-hidden group">
                      <img src={selectedApp.cnic_back_url} alt="CNIC Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ExternalLink size={20} className="text-white" />
                      </div>
                    </a>
                  </div>

                  {/* Selfie */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/40">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Selfie holding CNIC</span>
                      <button
                        onClick={() => handleDownloadImage(selectedApp.selfie_url, `${selectedApp.full_name}_selfie.jpg`)}
                        className="p-1 hover:text-blue-500 transition-colors"
                        title="Download Selfie"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                    <a href={selectedApp.selfie_url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[3/2] overflow-hidden group">
                      <img src={selectedApp.selfie_url} alt="Selfie" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <ExternalLink size={20} className="text-white" />
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Info size={13} className="text-blue-500" />
                  Application Info
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p>Submission timestamp: {formatDateString(selectedApp.created_at)} at {new Date(selectedApp.created_at).toLocaleTimeString()}</p>
                  {selectedApp.status === 'rejected' && selectedApp.rejection_reason && (
                    <p className="text-red-500 font-semibold">Rejection reason: {selectedApp.rejection_reason}</p>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              {selectedApp.status === 'pending' && (
                <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <Button
                    onClick={() => setRejectModalOpen(true)}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    disabled={updating}
                  >
                    Reject Application
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedApp)}
                    variant="primary"
                    loading={updating}
                  >
                    Approve & Verify User
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Rejection Reason Modal */}
        {rejectModalOpen && selectedApp && (
          <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)}>
            <div className="p-6 space-y-4 max-w-md">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reject Application</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please provide a detailed reason why this verification application is being rejected. The user will receive this note immediately.
              </p>

              <div>
                <label className="label">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="E.g., CNIC front image is blurry or expired."
                  className="input min-h-[100px]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={() => setRejectModalOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleReject} variant="danger" loading={updating}>
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};
