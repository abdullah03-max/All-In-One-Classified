import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ShieldCheck, Package } from 'lucide-react';
import { Input, Button } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const confirmSchema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ConfirmData = z.infer<typeof confirmSchema>;

export const ConfirmInvitationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const token = new URLSearchParams(location.search).get('token') || '';

  const [invitation, setInvitation] = useState<any>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ConfirmData>({
    resolver: zodResolver(confirmSchema),
  });

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing invitation token.');
      setLoadingInvite(false);
      return;
    }

    supabase
      .from('invitations')
      .select('*')
      .eq('id', token)
      .eq('status', 'pending')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Invitation is invalid, has expired, or has already been accepted.');
          setInvitation(null);
        } else if (new Date(data.expires_at) < new Date()) {
          toast.error('This invitation link has expired.');
          setInvitation(null);
        } else {
          setInvitation(data);
        }
        setLoadingInvite(false);
      });
  }, [token]);

  const onSubmit = async (data: ConfirmData) => {
    if (!invitation) return;

    try {
      // 1. Call RPC function to confirm the invitation and create auth/public rows
      const { data: rpcSuccess, error: rpcError } = await supabase.rpc('confirm_user_invitation', {
        invite_token: token,
        new_password: data.password,
        user_full_name: data.fullName
      });

      if (rpcError) throw rpcError;
      if (!rpcSuccess) throw new Error('Invitation confirmation failed');

      // 2. Sign in the user immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: data.password
      });

      if (signInError) throw signInError;

      const invitedRole = invitation.role; // 'admin' or 'moderator'
      toast.success(`Welcome aboard! Account activated as ${invitedRole}.`);
      
      // Refresh Auth state
      await refreshUser();

      // Redirect user to the corresponding dashboard
      if (invitedRole === 'admin') navigate('/admin');
      else if (invitedRole === 'moderator') navigate('/moderator');
      else navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm invitation');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">All in one</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">Confirm Invitation</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Activate your dashboard account</p>
        </div>

        <div className="card p-6 shadow-lg">
          {loadingInvite ? (
            <div className="text-center py-6 text-slate-500">Checking invitation link...</div>
          ) : invitation ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider block font-bold">Email Address</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{invitation.email}</span>
                <span className="mt-2 block text-xs">
                  Role: <span className="font-bold text-purple-600 dark:text-purple-400 capitalize">{invitation.role}</span>
                </span>
              </div>

              <Input
                label="Your Full Name"
                placeholder="E.g. Ali Raza"
                leftIcon={<User size={16} />}
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              <Input
                label="Create Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                Accept & Confirm <ShieldCheck size={16} className="ml-1.5" />
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                This invitation link is invalid or expired.
              </p>
              <Link to="/login" className="text-primary-600 hover:underline font-medium text-sm">
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
