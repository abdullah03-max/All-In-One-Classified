import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui';
import toast from 'react-hot-toast';

export const BecomeSellerPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string })?.from || '/dashboard';

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await updateProfile({ role: 'seller' });
      toast.success('Congratulations! You are now a Seller.');
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upgrade to seller');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Post unlimited listings for free',
    'Access advanced seller analytics and view tracking',
    'Manage offers and chat with buyers directly',
    'Earn a seller badge on your profile',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="card p-8 shadow-xl relative overflow-hidden">
          {/* Background sparkles decoration */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={120} className="text-primary-500" />
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
              <Shield size={32} className="text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Become a Seller</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-sm mx-auto">
              Upgrade your existing account to unlock advanced selling features instantly.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm uppercase tracking-wider">What you get:</h3>
            <div className="space-y-3">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-8 border border-slate-100 dark:border-slate-800/50">
            <div className="flex gap-3">
              <div className="text-2xl">💡</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Your email <strong className="text-slate-700 dark:text-slate-300">{user?.email}</strong> and password will remain the same. You will retain all your current buyer bookmarks, active offers, and chat history.
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleUpgrade}
              loading={loading}
              className="w-full"
              size="lg"
              iconRight={<ChevronRight size={18} />}
            >
              Enable Seller Account
            </Button>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors py-2 text-center"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
