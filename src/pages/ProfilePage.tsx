import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Camera, Save, Shield, Bell, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services';
import { Avatar, Button, Input, Textarea, Select } from '../components/ui';
import { CITIES } from '../utils/constants';
import { getUserRoles, userHasRole } from '../utils/helpers';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().max(500).optional(),
});
type ProfileData = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user, updateProfile, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [avatarLoading, setAvatarLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      city: user?.city || '',
      bio: user?.bio || '',
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarLoading(true);
    try {
      const url = await usersService.uploadAvatar(file, user.id);
      await updateProfile({ avatar_url: url });
      await refreshUser();
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (data: ProfileData) => {
    try {
      await updateProfile(data);
    } catch {
      toast.error('Failed to update profile');
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'profile' && (
          <div className="space-y-5">
            {/* Avatar */}
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Profile Photo</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar src={user?.avatar_url} name={user?.full_name || ''} size="xl" />
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors">
                    {avatarLoading ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={13} />
                    )}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={avatarLoading} />
                  </label>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{user?.full_name}</p>
                    {user?.is_verified && (
                      <CheckCircle size={16} className="text-blue-500 fill-blue-500/10 shrink-0" title="Verified Account" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                  {user?.is_verified && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      <Shield size={12} className="fill-blue-600/10" />
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

            {!userHasRole(user, 'moderator') && !userHasRole(user, 'admin') && !userHasRole(user, 'super_admin') && (
              <div className="card p-5 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-100 dark:border-primary-900/20">
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-0.5">🏪</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Start Selling</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      You can post a listing and start selling using your current account. No role switch required.
                    </p>
                    <button
                      onClick={() => navigate('/dashboard/listings/new')}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 shadow-sm"
                    >
                      Post Your First Ad
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile form */}
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Personal Information</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Full Name"
                  error={errors.full_name?.message}
                  {...register('full_name')}
                />
                <Input
                  label="Email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  hint="Email cannot be changed"
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+92 300 1234567"
                  {...register('phone')}
                />
                <Select
                  label="City"
                  options={CITIES.map(c => ({ value: c, label: c }))}
                  placeholder="Select your city"
                  {...register('city')}
                />
                <Textarea
                  label="Bio"
                  placeholder="Tell buyers/sellers about yourself..."
                  rows={4}
                  hint={`Max 500 characters`}
                  {...register('bio')}
                />
                <Button type="submit" icon={<Save size={16} />} loading={isSubmitting}>
                  Save Changes
                </Button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="card p-5 space-y-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Security Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Password</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Change your password</p>
                </div>
                <Button variant="secondary" size="sm">Change</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">Two-Factor Auth</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security</p>
                </div>
                <Button variant="secondary" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400 text-sm">Delete Account</p>
                  <p className="text-xs text-red-500 dark:text-red-400">Permanently delete your account</p>
                </div>
                <Button variant="danger" size="sm">Delete</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="card p-5 space-y-5">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Notification Preferences</h2>
            <div className="space-y-3">
              {[
                { label: 'New messages', desc: 'When you receive a new chat message' },
                { label: 'New offers', desc: 'When someone makes an offer on your listing' },
                { label: 'Listing status changes', desc: 'When your listing is approved or rejected' },
                { label: 'Price drops', desc: 'When a saved listing drops in price' },
                { label: 'Marketing emails', desc: 'Tips, features, and promotional content' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary-400 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                  </label>
                </div>
              ))}
            </div>
            <Button icon={<Save size={16} />}>Save Preferences</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
