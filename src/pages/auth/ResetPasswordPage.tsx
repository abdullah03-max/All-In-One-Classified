import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Package } from 'lucide-react';
import { Input, Button } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Check if user is authenticated (either from recovery link click or OTP verification)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsSessionActive(false);
        toast.error('Session expired or invalid reset link. Please request a new password reset.');
      }
    });
  }, []);

  const onSubmit = async (data: ResetPasswordData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;

      toast.success('Password updated successfully! Please sign in with your new password.');
      await supabase.auth.signOut(); // sign out from temporary recovery session
      navigate('/login');
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
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">All in one</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Set New Password</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Choose a strong, secure password</p>
        </div>

        <div className="card p-6 shadow-lg">
          {isSessionActive ? (
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
                Update Password
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Your recovery session is invalid or has expired.
              </p>
              <Link to="/forgot-password" className="text-primary-600 hover:underline font-medium text-sm">
                Request a new password reset
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
