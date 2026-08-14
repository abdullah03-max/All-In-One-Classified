import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Crown, Check, ShieldCheck, ArrowRight, CreditCard, Lock } from 'lucide-react';
import { Listing } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PromoteListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onSuccess?: () => void;
}

export interface PromotionPackage {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  badge: string;
  icon: React.ReactNode;
  color: string;
  badgeColor: string;
  features: string[];
}

export const PROMOTION_PACKAGES: PromotionPackage[] = [
  {
    id: 'urgent',
    name: 'Urgent Badge',
    price: 500,
    durationDays: 7,
    badge: 'URGENT',
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    color: 'from-amber-500/10 to-orange-500/10 border-amber-300 dark:border-amber-700',
    badgeColor: 'bg-amber-500 text-white',
    features: ['High-visibility Red Urgent Tag', 'Highlighted in Search Results', '7 Days Duration'],
  },
  {
    id: 'featured',
    name: 'Featured Ad',
    price: 1200,
    durationDays: 15,
    badge: 'FEATURED',
    icon: <Sparkles className="w-5 h-5 text-primary-500" />,
    color: 'from-primary-500/10 to-indigo-500/10 border-primary-400 dark:border-primary-600',
    badgeColor: 'bg-primary-600 text-white',
    features: ['Homepage Slider Placement', 'Top of Category Search', 'Gold Featured Badge', '15 Days Duration'],
  },
  {
    id: 'vip',
    name: 'Premium VIP',
    price: 2500,
    durationDays: 30,
    badge: 'VIP PRO',
    icon: <Crown className="w-5 h-5 text-purple-500" />,
    color: 'from-purple-500/10 to-pink-500/10 border-purple-400 dark:border-purple-600',
    badgeColor: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
    features: ['#1 Top Priority Ranking', '3x More Views & Inquiries', 'Featured Banner Slider', 'Golden Crown VIP Badge', '30 Days Duration'],
  },
];

export const PromoteListingModal: React.FC<PromoteListingModalProps> = ({
  isOpen,
  onClose,
  listing,
}) => {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<PromotionPackage>(PROMOTION_PACKAGES[1]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSafepayCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to promote your listing');
      return;
    }

    setLoading(true);
    try {
      // Call Vercel Serverless Function to initialize Safepay Tracker
      const res = await fetch('/api/safepay/create-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          user_id: user.id,
          package_id: selectedPackage.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkout_url) {
        throw new Error(data.error || 'Failed to initialize Safepay checkout');
      }

      toast.loading('Redirecting to Safepay Checkout...');
      // Redirect user to Safepay Hosted Checkout URL
      window.location.href = data.checkout_url;
    } catch (err: any) {
      console.error('Safepay checkout error:', err);
      toast.error(err.message || 'Payment server connection failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Promote Your Listing</h3>
                <p className="text-xs text-primary-100 line-clamp-1">{listing.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSafepayCheckout} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Step 1: Select Package */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                1. Select Promotion Package
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PROMOTION_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all bg-gradient-to-br ${pkg.color} ${
                        isSelected
                          ? 'border-primary-600 dark:border-primary-500 shadow-md ring-2 ring-primary-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs">
                          <Check size={12} />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        {pkg.icon}
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{pkg.name}</span>
                      </div>
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        PKR {pkg.price.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {pkg.durationDays} Days Duration
                      </div>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-primary-500 font-bold">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Safepay Gateway Info */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-slate-800/80 dark:to-slate-800/40 border border-indigo-100 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Safepay Sandbox Hosted Checkout</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                You will be redirected securely to Safepay Checkout to complete test payment using credit/debit card or supported mobile wallets.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={14} /> PCI-DSS Compliant
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Lock size={12} /> 256-Bit SSL Encrypted
                </span>
              </div>
            </div>

            {/* Total Summary & Submit Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-500">Total Payable:</span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  PKR {selectedPackage.price.toLocaleString()}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-primary-600 hover:from-indigo-700 hover:to-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Initializing Checkout...' : 'Proceed to Safepay Checkout'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
