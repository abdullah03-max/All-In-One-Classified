import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Shield, Upload, FileText, CheckCircle, XCircle, AlertCircle, Clock, Calendar, Phone, MapPin, ArrowRight, Mail
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Skeleton } from '../../components/ui';
import { verificationService, notificationsService } from '../../services';
import { VerificationApplication } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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

export const UserVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const [latestApp, setLatestApp] = useState<VerificationApplication | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [cnicNumber, setCnicNumber] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Upload states
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchApp = async () => {
      try {
        const app = await verificationService.getLatestApplication(user.id);
        setLatestApp(app);
      } catch (err) {
        console.error('Failed to load latest application:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApp();

    // Subscribe to real-time status updates for the user's applications
    const channel = verificationService.subscribeToUserApplication(user.id, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        setLatestApp(payload.new as VerificationApplication);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Handle files
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB');
        return;
      }
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!fullName || !cnicNumber || !dob || !phone || !city) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (!frontFile || !backFile || !selfieFile) {
      toast.error('Please upload all required images.');
      return;
    }

    if (!agreeTerms) {
      toast.error('You must agree to the Terms & Conditions.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload Front CNIC
      const frontUrl = await verificationService.uploadDocument(frontFile, 'front', user.id);
      // 2. Upload Back CNIC
      const backUrl = await verificationService.uploadDocument(backFile, 'back', user.id);
      // 3. Upload Selfie with CNIC
      const selfieUrl = await verificationService.uploadDocument(selfieFile, 'selfie', user.id);

      // 4. Submit application
      const newApp = await verificationService.submitApplication(user.id, {
        full_name: fullName,
        cnic_number: cnicNumber,
        dob,
        phone,
        city,
        cnic_front_url: frontUrl,
        cnic_back_url: backUrl,
        selfie_url: selfieUrl,
        address: address || undefined,
      });

      setLatestApp(newApp);

      // 5. Send Notification
      await notificationsService.createNotification({
        user_id: user.id,
        type: 'system',
        title: 'Verification Request Submitted',
        message: 'Your account verification application has been received and is under review.',
        is_read: false,
      });

      toast.success('Your verification request has been submitted successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Account Verification">
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  // Helper to format timestamps
  const formatTime = (ts: string) => {
    try {
      return format(new Date(ts), 'PPP p');
    } catch {
      return ts;
    }
  };

  return (
    <DashboardLayout navItems={navItems} title="Account Verification">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <UserCheck size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Account Verification (KYC)</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Verify your identity to build trust and receive a Verified Account badge.</p>
          </div>
        </div>

        {/* Verification Status Cards (Email & Account KYC) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${user?.email_verified ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Email Verification</p>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {user?.email_verified ? 'Verified' : 'Not Verified'}
                </h3>
              </div>
            </div>
            {user?.email_verified ? (
              <CheckCircle className="text-green-500" size={18} />
            ) : (
              <XCircle className="text-red-500" size={18} />
            )}
          </div>

          <div className="card p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${user?.is_verified ? 'bg-green-500/10 text-green-600' : latestApp?.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'}`}>
                <Shield size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Account Verification</p>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {user?.is_verified ? 'Verified User' : latestApp?.status === 'pending' ? 'Under Review' : latestApp?.status === 'rejected' ? 'Rejected' : 'Not Verified'}
                </h3>
              </div>
            </div>
            {user?.is_verified ? (
              <CheckCircle className="text-green-500" size={18} />
            ) : latestApp?.status === 'pending' ? (
              <Clock className="text-yellow-500" size={18} />
            ) : (
              <XCircle className="text-red-500" size={18} />
            )}
          </div>
        </div>

        {/* Application Status Banner / Tracking Timeline */}
        {latestApp && (
          <div className="card p-6 mb-8 border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Verification Status Tracker
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Submission Step */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Application Submitted</h4>
                  <p className="text-xs text-slate-500 mt-1">{formatTime(latestApp.created_at)}</p>
                </div>
              </div>

              {/* Review Step */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  latestApp.status === 'pending'
                    ? 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                    : 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                }`}>
                  {latestApp.status === 'pending' ? <Clock size={20} /> : <CheckCircle size={20} />}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Under Review</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {latestApp.status === 'pending' ? 'Our agents are inspecting details' : 'Review completed'}
                  </p>
                </div>
              </div>

              {/* Decision Step */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  latestApp.status === 'pending'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    : latestApp.status === 'approved'
                    ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                }`}>
                  {latestApp.status === 'pending' ? <Shield size={20} /> : latestApp.status === 'approved' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {latestApp.status === 'pending' ? 'Decision' : latestApp.status === 'approved' ? 'Approved (Verified)' : 'Rejected'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {latestApp.status === 'pending'
                      ? 'Awaiting final approval'
                      : latestApp.status === 'approved'
                      ? 'Congratulations! Your account is verified'
                      : 'Please review re-submission terms'}
                  </p>
                </div>
              </div>
            </div>

            {/* Application messages */}
            {latestApp.status === 'pending' && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-xl text-sm flex items-start gap-3">
                <Clock size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Your verification request is pending review.</p>
                  <p className="text-xs mt-1 text-yellow-700/80 dark:text-yellow-300/80">
                    Our team will review your application within 2–3 working days. You cannot submit another application until the review is complete.
                  </p>
                </div>
              </div>
            )}

            {latestApp.status === 'approved' && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-200 rounded-xl text-sm flex items-start gap-3">
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Congratulations! Your identity is verified.</p>
                  <p className="text-xs mt-1 text-blue-700/80 dark:text-blue-300/80">
                    Your profile now carries a verified badge, indicating a premium and trusted account in the marketplace.
                  </p>
                </div>
              </div>
            )}

            {latestApp.status === 'rejected' && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-200 rounded-xl text-sm flex items-start gap-3">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Your verification request has been rejected.</p>
                  {latestApp.rejection_reason && (
                    <p className="text-xs mt-1 font-semibold">Reason: {latestApp.rejection_reason}</p>
                  )}
                  <p className="text-xs mt-2 text-red-700/80 dark:text-red-300/80">
                    Please correct the highlighted issues and click the button below to submit a new verification application.
                  </p>
                  <button
                    onClick={() => setLatestApp(null)}
                    className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    Submit New Application
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Application Form */}
        {!latestApp && (
          <form onSubmit={handleSubmit} className="card p-6 border border-slate-200 dark:border-slate-800/80 space-y-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              Application Details
            </h3>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name (As on CNIC) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="E.g., Abdullah Ali"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">CNIC Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={cnicNumber}
                  onChange={e => setCnicNumber(e.target.value)}
                  placeholder="E.g., 37405-1234567-1"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Date of Birth <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Phone Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="E.g., 0300-1234567"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">City <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="E.g., Rawalpindi"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Residential Address (Optional)</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="E.g., House 123, Street 4, Islamabad"
                className="input min-h-[80px]"
              />
            </div>

            {/* Document Uploads */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <FileText size={16} className="text-blue-500" />
                Required Verification Documents
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Please upload clear photos of your original documents. Max size 5MB per file.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CNIC Front */}
                <div className="space-y-2">
                  <label className="label text-xs font-semibold">CNIC Front Side <span className="text-red-500">*</span></label>
                  <div className="relative aspect-[3/2] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl overflow-hidden flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/20 transition-colors">
                    {frontPreview ? (
                      <img src={frontPreview} alt="CNIC Front" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 text-center">
                        <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                        <span className="text-[11px] text-slate-500">Upload Front Photo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileChange(e, setFrontFile, setFrontPreview)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                </div>

                {/* CNIC Back */}
                <div className="space-y-2">
                  <label className="label text-xs font-semibold">CNIC Back Side <span className="text-red-500">*</span></label>
                  <div className="relative aspect-[3/2] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl overflow-hidden flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/20 transition-colors">
                    {backPreview ? (
                      <img src={backPreview} alt="CNIC Back" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 text-center">
                        <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                        <span className="text-[11px] text-slate-500">Upload Back Photo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileChange(e, setBackFile, setBackPreview)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                </div>

                {/* Selfie holding CNIC */}
                <div className="space-y-2">
                  <label className="label text-xs font-semibold">Selfie Holding CNIC <span className="text-red-500">*</span></label>
                  <div className="relative aspect-[3/2] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl overflow-hidden flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/20 transition-colors">
                    {selfiePreview ? (
                      <img src={selfiePreview} alt="Selfie with CNIC" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 text-center">
                        <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                        <span className="text-[11px] text-slate-500">Upload Selfie holding CNIC</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileChange(e, setSelfieFile, setSelfiePreview)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Consent */}
            <div className="flex items-start gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                required
              />
              <label htmlFor="agreeTerms" className="text-xs text-slate-500 dark:text-slate-400">
                I hereby verify that all the information provided above, including my CNIC details and images, is authentic and belongs to me. I consent to let the platform store and review this data for identity verification purposes.
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="submit"
                variant="primary"
                loading={submitting}
                className="px-6 rounded-xl font-semibold shadow-md shadow-blue-500/10 hover:shadow-blue-500/20"
              >
                Submit Verification Request
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};
