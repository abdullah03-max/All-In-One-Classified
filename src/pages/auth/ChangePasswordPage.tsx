import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Package, AlertTriangle } from 'lucide-react';
import { Input, Button } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const changePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordData) => {
    try {
      // 1. Update the password in auth.users
      const { error: authError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (authError) throw authError;

      // 2. Set is_temp_password to false in public.users
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { error: dbError } = await supabase
          .from('users')
          .update({ is_temp_password: false })
          .eq('id', authUser.id);
        
        if (dbError) throw dbError;
      }

      toast.success('Your password has been updated successfully!');
      
      // Refresh AuthContext user state
      const updatedUser = await refreshUser();

      // Redirect based on role
      if (updatedUser) {
        if (updatedUser.role === 'super_admin') navigate('/superadmin', { replace: true });
        else if (updatedUser.role === 'admin') navigate('/admin', { replace: true });
        else if (updatedUser.role === 'moderator') navigate('/moderator', { replace: true });
        else navigate('/', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
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
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">All in one</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reset Temporary Password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Please change your temporary password to continue</p>
        </div>

        <div className="card p-6 shadow-lg">
          <div className="mb-4 flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
            <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-yellow-850 dark:text-yellow-400">Security Requirement</p>
              <p className="text-xs text-yellow-750 dark:text-yellow-500 mt-0.5">
                You are logging in with a temporary password. You must set a new secure password before you can access the dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
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
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Set New Password & Login
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
