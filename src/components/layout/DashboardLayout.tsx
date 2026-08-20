import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Menu, X, LogOut,
  LayoutDashboard, Package, Plus, Heart,
  DollarSign, MessageCircle, BarChart2, Settings,
  Shield, UserCheck, Users, CreditCard, Tag, Database,
  ChevronDown, Home, User, Sun, Moon, Bell, Sparkles,
  ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { Avatar, Badge } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../utils/helpers';
import Icon from '../ui/Icon';
import AIChatbotModal from '../chat/AIChatbotModal';

interface NavItem {
  label: string;
  icon: string;
  to: string;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, navItems, title }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Choose the sidebar nav items dynamically based on the user's role
  let finalNavItems = navItems;
  if (user) {
    if (user.roles?.includes('super_admin')) {
      finalNavItems = [
        { label: 'Overview', icon: 'LayoutDashboard', to: '/superadmin' },
        { label: 'Admin Management', icon: 'Shield', to: '/superadmin/admins' },
        { label: 'Moderator Management', icon: 'UserCheck', to: '/superadmin/moderators' },
        { label: 'Listings', icon: 'Package', to: '/superadmin/listings' },
        { label: 'User Management', icon: 'Users', to: '/superadmin/users' },
        { label: 'Payments', icon: 'CreditCard', to: '/superadmin/payments' },
        { label: 'Categories', icon: 'Tag', to: '/superadmin/categories' },
        { label: 'Global Analytics', icon: 'BarChart2', to: '/superadmin/analytics' },
        { label: 'System Config', icon: 'Settings', to: '/superadmin/config' },
        { label: 'Database Settings', icon: 'Database', to: '/superadmin/database' },
      ];
    } else if (user.roles?.includes('admin')) {
      finalNavItems = [
        { label: 'Overview', icon: 'LayoutDashboard', to: '/admin' },
        { label: 'Listings', icon: 'Package', to: '/admin/listings' },
        { label: 'Users', icon: 'Users', to: '/admin/users' },
        { label: 'Verification Applications', icon: 'UserCheck', to: '/admin/verifications' },
        { label: 'Categories', icon: 'Tag', to: '/admin/categories' },
        { label: 'Moderators', icon: 'Shield', to: '/admin/moderators' },
        { label: 'Analytics', icon: 'BarChart2', to: '/admin/analytics' },
        { label: 'Settings', icon: 'Settings', to: '/profile' },
      ];
    } else if (user.role === 'buyer' || user.role === 'seller') {
      const hasMyListings = navItems.some(item => item.label === 'My Listings');
      if (hasMyListings && !navItems.some(item => item.label === 'Account Verification')) {
        const index = navItems.findIndex(item => item.label === 'Analytics');
        const updated = [...navItems];
        const newItem = { label: 'Account Verification', icon: 'UserCheck', to: '/dashboard/verification' };
        if (index !== -1) {
          updated.splice(index, 0, newItem);
        } else {
          updated.push(newItem);
        }
        finalNavItems = updated;
      }
    }
  }

  // Ensure AI Assistant is always present in dashboard sidebar
  if (!finalNavItems.some(item => item.label === 'AI Assistant')) {
    finalNavItems = [
      ...finalNavItems,
      { label: 'AI Assistant', icon: 'Sparkles', to: '#ai-assistant' }
    ];
  }

  const isActive = (to: string) => {
    if (to === '#ai-assistant') return false;
    return location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to + '/'));
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group min-w-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 shadow-sm shrink-0">
            <img src="/logo.png" alt="All in one" className="w-full h-full object-cover rounded-lg" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-black text-base tracking-tight text-slate-900 dark:text-white truncate">
                All in one
              </span>
              <span className="text-[9px] uppercase font-bold text-primary-600 dark:text-primary-400 tracking-wider">
                User Dashboard
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-none">
        {finalNavItems.map(item => {
          if (item.to === '#ai-assistant') {
            return (
              <button
                key={item.label}
                onClick={() => {
                  setMobileOpen(false);
                  setIsAiModalOpen(true);
                }}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all w-full text-left group',
                  'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-300 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Sparkles size={17} className="shrink-0 text-amber-500 group-hover:scale-110 transition-transform" />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!collapsed && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    AI
                  </span>
                )}
              </button>
            );
          }

          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all group',
                active
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                name={item.icon}
                size={17}
                className={cn(
                  'shrink-0 transition-transform group-hover:scale-110',
                  active ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary-500'
                )}
              />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && item.badge > 0 && (
                <span className={cn(
                  'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                  active ? 'bg-white text-primary-600' : 'bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer Widget */}
      {user && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
          <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
            <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user.full_name}</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 size={11} /> Verified Account
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapse button */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse Menu</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 overflow-hidden shrink-0 h-full shadow-sm z-20"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <span className="font-black text-slate-900 dark:text-slate-100">All in one Dashboard</span>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Menu size={19} />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="text-xs font-semibold text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 transition-colors"
              >
                <Home size={14} />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-700 text-xs">/</span>
              <h1 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            {/* Quick Post Ad CTA */}
            <Link
              to="/dashboard/listings/new"
              className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-primary-600/25 transition-all flex items-center gap-1.5"
            >
              <Plus size={15} className="stroke-[3]" />
              <span>Post New Ad</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </div>
      </div>

      {/* AI Assistant Chatbot Modal */}
      <AIChatbotModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </div>
  );
};

export default DashboardLayout;