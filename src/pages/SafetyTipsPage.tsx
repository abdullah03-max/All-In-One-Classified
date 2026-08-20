import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Eye,
  CreditCard,
  Lock,
  Smartphone,
  Car,
  Home,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flag
} from 'lucide-react';

export const SafetyTipsPage: React.FC = () => {
  const goldenRules = [
    {
      icon: MapPin,
      title: 'Meet in Busy, Public Places',
      desc: 'Always arrange meetings in well-lit public spots like shopping malls, bank lobbies, metro stations, or popular cafes during daylight hours. Never meet in secluded areas alone.',
      badge: 'Location Safety',
      color: 'blue',
    },
    {
      icon: Eye,
      title: 'Inspect Thoroughly Before Paying',
      desc: 'Test the device, verify IMEI PTA status on mobiles (dial *#06#), check car engine numbers against excise records, and ensure condition matches the ad before handing over money.',
      badge: 'Inspection',
      color: 'emerald',
    },
    {
      icon: CreditCard,
      title: 'Never Send Advance Bank Transfers',
      desc: 'Be extremely cautious if a seller demands advance delivery charges, booking deposits, or wire transfers via Easypaisa/JazzCash before you have inspected the product in person.',
      badge: 'Payment Safety',
      color: 'amber',
    },
    {
      icon: Lock,
      title: 'Keep Personal Credentials Private',
      desc: 'Our staff will NEVER ask for your password, bank PIN, or SMS OTP codes. Never share verification codes with anyone claiming to be a customer service representative.',
      badge: 'Account Security',
      color: 'purple',
    },
    {
      icon: MessageSquare,
      title: 'Use In-App SafeChat',
      desc: 'Keep all communications within our built-in SafeChat. This maintains an audit trail and allows our moderators to protect you if a dispute arises.',
      badge: 'Communication',
      color: 'teal',
    },
    {
      icon: Flag,
      title: 'Report Suspicious Listings Immediately',
      desc: 'If a deal appears unrealistically cheap, or a buyer/seller sends fake payment screenshots or behaves suspiciously, tap "Report Listing" so our team can ban them.',
      badge: 'Community Protection',
      color: 'rose',
    },
  ];

  const categorySafety = [
    {
      icon: Smartphone,
      title: 'Mobiles, Laptops & Electronics',
      dos: [
        'Check PTA approval status by sending IMEI to 8484 (CPLC / DIRBS).',
        'Inspect for battery health, screen replacements, and iCloud/Google locks.',
        'Ask for the original box, invoice, and national CNIC copy of the seller.',
      ],
      donts: [
        'Do not buy bypass or carrier-locked phones without knowing the risks.',
        'Do not pay advance courier fees for "cheap smuggled / custom confiscated" items.',
      ],
    },
    {
      icon: Car,
      title: 'Cars, Bikes & Vehicles',
      dos: [
        'Verify original registration book, file, and computerized token tax records.',
        'Check vehicle records on the official Excise & Taxation portal (MTMIS).',
        'Conduct a mechanical inspection and test drive with an experienced friend.',
      ],
      donts: [
        'Do not buy vehicles on open transfer letters without biometric verification.',
        'Do not finalize car deals late at night or on highways.',
      ],
    },
    {
      icon: Home,
      title: 'Property & Real Estate',
      dos: [
        'Verify ownership documents, allotment letters, and society NOCs at the housing authority.',
        'Visit the exact plot or property location in person to verify possession.',
      ],
      donts: [
        'Do not pay cash tokens without signed stamp paper agreements and witness CNICs.',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* ── 1. HERO HEADER ── */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-4">
          <ShieldCheck size={14} /> Trust & Safety Guidelines
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-4">
          Safety Tips for Smart Trading
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal">
          Your safety is our top priority. Follow these proven guidelines to enjoy safe, scam-free buying and selling across Pakistan.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* ── 2. GOLDEN RULES GRID ── */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              The 6 Golden Rules of Safe Trading
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Always keep these principles in mind before finalizing any classified transaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goldenRules.map((rule, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <rule.icon size={22} />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {rule.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                  {rule.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {rule.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. CATEGORY SPECIFIC DOS AND DONTS ── */}
        <section className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2 text-center sm:text-left">
            Category-Specific Safety Advice
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8 text-center sm:text-left">
            Important precautions when trading high-value goods.
          </p>

          <div className="space-y-6">
            {categorySafety.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                    <item.icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {/* DOs */}
                  <div className="space-y-2">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 size={15} /> WHAT TO DO:
                    </p>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      {item.dos.map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* DONTs */}
                  <div className="space-y-2">
                    <p className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 text-xs">
                      <XCircle size={15} /> WHAT TO AVOID:
                    </p>
                    <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      {item.donts.map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. REPORT SCAMS PROMO ── */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-red-600/90 to-rose-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle size={14} /> Zero Tolerance Policy
            </div>
            <h3 className="text-xl sm:text-2xl font-black">Spot something suspicious?</h3>
            <p className="text-xs sm:text-sm text-red-100 max-w-lg">
              Help us keep the marketplace safe. Tap "Report Listing" on any suspicious ad or contact support immediately.
            </p>
          </div>
          <Link
            to="/help"
            className="px-6 py-3.5 bg-white text-red-600 hover:bg-red-50 font-bold text-sm rounded-2xl shadow-lg shrink-0 transition-all"
          >
            Visit Help Center
          </Link>
        </section>
      </div>
    </div>
  );
};

export default SafetyTipsPage;
