import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Crown, Check, CreditCard, Building2, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { Listing } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { paymentsService } from '../../services';
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
  onSuccess,
}) => {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<PromotionPackage>(PROMOTION_PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<'local' | 'card'>('local');
  const [transactionId, setTransactionId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to promote your listing');
      return;
    }

    if (paymentMethod === 'local' && !transactionId.trim()) {
      toast.error('Please enter your Transaction Reference ID / TRX ID');
      return;
    }

    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvc)) {
      toast.error('Please complete all card details');
      return;
    }

    setLoading(true);
    try {
      await paymentsService.createPayment({
        listing_id: listing.id,
        user_id: user.id,
        amount: selectedPackage.price,
        currency: 'PKR',
        method: paymentMethod === 'local' ? 'JazzCash / EasyPaisa / Bank' : 'Credit / Debit Card',
        status: paymentMethod === 'card' ? 'completed' : 'pending',
        transaction_id: transactionId.trim() || `CARD-${Date.now()}`,
        receipt_url: receiptUrl.trim() || undefined,
        package_name: selectedPackage.name,
        duration_days: selectedPackage.durationDays,
        notes: `Promotion package: ${selectedPackage.name} for listing: ${listing.title}`,
      });

      if (paymentMethod === 'card') {
        toast.success(`🎉 ${selectedPackage.name} activated successfully for 30 days!`);
      } else {
        toast.success('✅ Payment submitted! Admin will verify your transaction shortly.');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Promotion error:', err);
      toast.error(err.message || 'Failed to submit payment. Please try again.');
    } finally {
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

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
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

            {/* Step 2: Payment Method */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                2. Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('local')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-medium text-sm transition-all cursor-pointer ${
                    paymentMethod === 'local'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span>JazzCash / EasyPaisa / Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-medium text-sm transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Credit / Debit Card</span>
                </button>
              </div>
            </div>

            {/* Step 3: Payment Details */}
            {paymentMethod === 'local' ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Building2 className="w-4 h-4 text-primary-500" />
                  <span>Transfer Accounts</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="font-bold text-red-600">JazzCash / EasyPaisa</div>
                    <div className="text-slate-800 dark:text-slate-200 font-mono text-sm font-semibold mt-1">0300-1234567</div>
                    <div className="text-slate-500">Title: All In One Classified</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="font-bold text-emerald-600">Meezan Bank (IBAN)</div>
                    <div className="text-slate-800 dark:text-slate-200 font-mono text-xs font-semibold mt-1">PK12MEZN00012345678901</div>
                    <div className="text-slate-500">Title: All In One Classified</div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transaction ID / Reference TRX ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01928374652"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Receipt Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4242 •••• •••• 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">CVC / CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

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
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Processing...' : 'Pay & Promote'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
