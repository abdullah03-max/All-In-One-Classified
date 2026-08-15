import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Menu, X, LogOut,
  LayoutDashboard, Package, Plus, Heart,
  DollarSign, MessageCircle, BarChart2, Settings,
  Shield, UserCheck, Users, CreditCard, Tag, Database,
  ChevronDown, Home, User
} from 'lucide-react';
import { Avatar, Badge } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setDropdownOpen(false);
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

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/');

  const SidebarContent = () => (
    <>
      {/* Navigation - No Profile Section */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-600 dark:text-primary-400">Marketplace</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left',
                  'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={18} className="shrink-0 text-yellow-500" />
                {!collapsed && (
                  <span className="flex-1 text-sm font-semibold">{item.label}</span>
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive(item.to)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} size={18} className="shrink-0" />
              {!collapsed && (
                <span className="flex-1 text-sm">{item.label}</span>
              )}
              {!collapsed && item.badge && item.badge > 0 && (
                <Badge variant="info" className="text-xs">{item.badge}</Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full',
            'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span className="text-sm">Collapse</span></>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 h-full"
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
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-slate-100">Marketplace</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Dashboard Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Menu size={20} />
            </button>
            {/* Home button */}
            <Link
              to="/"
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              title="Go to Homepage"
            >
              <Home size={20} />
            </Link>
            <h1 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">{title}</h1>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </div>
      </div>

      {/* AI Assistant Chatbot Modal */}
      <AIChatbotModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </div>
  );
};

export default DashboardLayout;