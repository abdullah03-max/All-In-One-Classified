import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Save, Shield, Bell, Lock, CheckCircle, AlertTriangle, Key, Trash2, Smartphone, Eye, EyeOff, ShieldCheck, Mail, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services';
import { Avatar, Button, Input, Textarea, Select, Modal } from '../components/ui';
import { CITIES } from '../utils/constants';
import { getUserRoles, userHasRole } from '../utils/helpers';
import { NotificationPreferences } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(3, 'Full name must be at least 3 characters'),
  phone: z.string().optional().refine(val => !val || /^\+?[0-9\s\-]{7,18}$/.test(val), {
    message: 'Invalid phone number format',
  }),
  city: z.string().optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
});
type ProfileData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});
type PasswordData = z.infer<typeof passwordSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, refreshUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA Modal State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notifications State
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    new_messages: true,
    new_offers: true,
    listing_status_changes: true,
    price_drops: false,
    marketing_emails: false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Initialize form default values
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      city: user?.city || '',
      bio: user?.bio || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  // Sync user profile data to form on load
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        phone: user.phone || '',
        city: user.city || '',
        bio: user.bio || '',
      });
      if (user.notification_preferences) {
        setNotifPrefs({
          new_messages: user.notification_preferences.new_messages ?? true,
          new_offers: user.notification_preferences.new_offers ?? true,
          listing_status_changes: user.notification_preferences.listing_status_changes ?? true,
          price_drops: user.notification_preferences.price_drops ?? false,
          marketing_emails: user.notification_preferences.marketing_emails ?? false,
        });
      }
    }
  }, [user, reset]);

  const currentBio = watch('bio') || '';

  // Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setAvatarLoading(true);
    try {
      const url = await usersService.uploadAvatar(file, user.id);
      await updateProfile({ avatar_url: url });
      await refreshUser();
      toast.success('Profile photo updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  // Personal Info Form Submit
  const onSubmitProfile = async (data: ProfileData) => {
    try {
      await updateProfile({
        full_name: data.full_name.trim(),
        phone: data.phone?.trim() || null,
        city: data.city || null,
        bio: data.bio?.trim() || null,
      });
      await refreshUser();
      toast.success('Personal information saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    }
  };

  // Change Password Submit
  const onChangePassword = async (data: PasswordData) => {
    if (!user?.email) return;
    setPasswordLoading(true);
    try {
      // 1. Verify current password
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (verifyErr) {
        toast.error('Current password is incorrect');
        setPasswordLoading(false);
        return;
      }

      // 2. Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateErr) throw updateErr;

      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      resetPasswordForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Toggle 2FA Setup
  const handleToggle2FA = async () => {
    if (user?.two_factor_enabled) {
      // Disable 2FA
      setTwoFactorLoading(true);
      try {
        await updateProfile({ two_factor_enabled: false });
        await refreshUser();
        toast.success('Two-Factor Authentication disabled');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update 2FA setting');
      } finally {
        setTwoFactorLoading(false);
      }
    } else {
      // Enable 2FA -> Generate verification OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpCode('');
      setShow2FAModal(true);

      // Send verification code via email Edge function
      if (user?.email) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: user.email,
              subject: `Two-Factor Verification Code: ${code}`,
              text: `Your 2FA verification code is: ${code}`,
              html: `<p>Your 2FA verification code is: <strong>${code}</strong></p>`
            }
          });
          toast.success(`Verification code sent to ${user.email}`);
        } catch {
          toast.error('Sent verification code (check inbox)');
        }
      }
    }
  };

  const verifyAndEnable2FA = async () => {
    if (otpCode.trim() !== generatedOtp) {
      toast.error('Invalid 6-digit verification code');
      return;
    }
    setTwoFactorLoading(true);
    try {
      await updateProfile({ two_factor_enabled: true });
      await refreshUser();
      toast.success('Two-Factor Authentication enabled successfully!');
      setShow2FAModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to enable 2FA');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Delete Account Action
  const handleDeleteAccount = async () => {
    if (!user?.email || !deleteConfirmPassword) {
      toast.error('Please enter your password to confirm account deletion');
      return;
    }
    setDeleteLoading(true);
    try {
      // 1. Verify password before permanent deletion
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deleteConfirmPassword,
      });

      if (authErr) {
        toast.error('Incorrect password. Account deletion cancelled.');
        setDeleteLoading(false);
        return;
      }

      // 2. Delete all database records for this user
      await usersService.deleteUserAccount(user.id);

      // 3. Sign out and redirect
      await signOut();
      toast.success('Your account has been permanently deleted.');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
      setDeleteLoading(false);
    }
  };

  // Save Notification Preferences
  const handleSaveNotifications = async () => {
    setSavingNotifs(true);
    try {
      await updateProfile({ notification_preferences: notifPrefs });
      await refreshUser();
      toast.success('Notification preferences updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save notification preferences');
    } finally {
      setSavingNotifs(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <Shield size={16} /> },
    { id: 'security', label: 'Security', icon: <Lock size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Account Settings</h1>

      {/* Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 shadow-inner">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {/* ============================================================ */}
        {/* PROFILE TAB */}
        {/* ============================================================ */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            {/* Profile Photo Card */}
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Profile Photo</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar src={user?.avatar_url} name={user?.full_name || ''} size="xl" />
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-95">
                    {avatarLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={15} />
                    )}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={avatarLoading} />
                  </label>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.full_name}</p>
                    {user?.is_verified ? (
                      <CheckCircle size={16} className="text-emerald-500 fill-emerald-500/10 shrink-0" title="Verified User" />
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">Unverified</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                  {user?.is_verified && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Shield size={12} className="fill-emerald-600/10" />
                      Verified Account
                    </div>
                  )}
                  {getUserRoles(user).length > 0 && (
                    <span className="badge bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 capitalize mt-1.5 inline-block">
                      {getUserRoles(user).map(role => role.replace('_', ' ')).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Start Selling Banner */}
            {!userHasRole(user, 'moderator') && !userHasRole(user, 'admin') && !userHasRole(user, 'super_admin') && (
              <div className="card p-5 bg-gradient-to-r from-primary-500/10 to-indigo-500/10 border border-primary-100 dark:border-primary-900/20">
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-0.5">🏪</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Start Selling</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      You can post a listing and start selling using your current account. No role switch required.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard/listings/new')}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      Post Your First Ad
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Information Form */}
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Personal Information</h2>
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                <Input
                  label="Full Name"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-sm cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">Read-only</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Email address cannot be changed from profile settings.</p>
                </div>

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+92 300 1234567"
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                <Select
                  label="City"
                  options={CITIES.map(c => ({ value: c, label: c }))}
                  placeholder="Select your city"
                  error={errors.city?.message}
                  {...register('city')}
                />

                <div>
                  <Textarea
                    label="Bio"
                    placeholder="Tell buyers/sellers about yourself..."
                    rows={4}
                    error={errors.bio?.message}
                    {...register('bio')}
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${currentBio.length > 480 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                      {500 - currentBio.length} characters remaining
                    </span>
                  </div>
                </div>

                <Button type="submit" icon={<Save size={16} />} loading={isSubmitting} disabled={isSubmitting}>
                  Save Changes
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SECURITY TAB */}
        {/* ============================================================ */}
        {activeTab === 'security' && (
          <div className="card p-5 space-y-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Security Settings</h2>
            
            <div className="space-y-4">
              {/* Change Password Card */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                    <Key size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Account Password</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Update your account login password</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
                  Change Password
                </Button>
              </div>

              {/* Two-Factor Authentication Card */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Two-Factor Authentication (2FA)</p>
                      {user?.two_factor_enabled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">Enabled</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400">Disabled</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Require an email OTP code when signing in</p>
                  </div>
                </div>
                <Button
                  variant={user?.two_factor_enabled ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={handleToggle2FA}
                  loading={twoFactorLoading}
                >
                  {user?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
              </div>

              {/* Delete Account Card (Danger Zone) */}
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200/60 dark:border-red-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-400 text-sm">Delete Account</p>
                    <p className="text-xs text-red-500 dark:text-red-400/80">Permanently delete your profile, listings, and messages</p>
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* NOTIFICATIONS TAB */}
        {/* ============================================================ */}
        {activeTab === 'notifications' && (
          <div className="card p-5 space-y-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Notification Preferences</h2>
            
            <div className="space-y-3">
              {[
                { key: 'new_messages', label: 'New messages', desc: 'Receive browser notifications when a new chat message arrives' },
                { key: 'new_offers', label: 'New offers', desc: 'Get notified when someone makes an offer on your listing' },
                { key: 'listing_status_changes', label: 'Listing status changes', desc: 'Get notified when your listing is approved, rejected, or updated' },
                { key: 'price_drops', label: 'Price drops', desc: 'Get notified when a saved listing drops in price' },
                { key: 'marketing_emails', label: 'Marketing emails', desc: 'Receive marketplace tips, updates, and promotional content' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={notifPrefs[item.key as keyof NotificationPreferences]}
                      onChange={(e) => setNotifPrefs(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                  </label>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSaveNotifications}
              icon={<Save size={16} />}
              loading={savingNotifs}
              disabled={savingNotifs}
            >
              Save Preferences
            </Button>
          </div>
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* CHANGE PASSWORD MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); resetPasswordForm(); }}
        title="Change Password"
        size="md"
      >
        <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4 p-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                {...registerPassword('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-xs text-red-500">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                {...registerPassword('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="mt-1 text-xs text-red-500">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              {...registerPassword('confirmPassword')}
            />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" type="button" onClick={() => { setShowPasswordModal(false); resetPasswordForm(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={passwordLoading} disabled={passwordLoading}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* 2FA VERIFICATION MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        title="Enable Two-Factor Authentication"
        size="md"
      >
        <div className="p-2 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            We sent a 6-digit verification code to <strong className="text-slate-900 dark:text-slate-100">{user?.email}</strong>. Enter the code below to enable 2FA.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              6-Digit OTP Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              className="w-full px-3.5 py-3 text-center tracking-[0.5em] font-mono text-lg font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShow2FAModal(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={verifyAndEnable2FA} loading={twoFactorLoading} disabled={twoFactorLoading}>
              Verify & Enable
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteConfirmPassword(''); }}
        title="Delete Account Permanently"
        size="md"
      >
        <div className="p-2 space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-400 text-xs">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold mb-0.5">Warning: This action cannot be undone.</p>
              <p>Deleting your account will permanently wipe your profile, active listings, offers, bookmarks, chats, and notifications from the platform.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Enter your password to confirm
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={deleteConfirmPassword}
              onChange={(e) => setDeleteConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="secondary" type="button" onClick={() => { setShowDeleteModal(false); setDeleteConfirmPassword(''); }}>
              Cancel
            </Button>
            <Button variant="danger" type="button" onClick={handleDeleteAccount} loading={deleteLoading} disabled={deleteLoading}>
              Permanently Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
