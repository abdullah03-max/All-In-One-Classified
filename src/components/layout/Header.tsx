import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Heart, MessageCircle, ChevronDown, Sun, Moon,
  Settings, LogOut, Plus, Menu, X, Package, LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar, Modal } from '../ui';
import { CATEGORIES } from '../../utils/constants';
import Icon from '../ui/Icon';
import { notificationsService } from '../../services';
import { Notification } from '../../types';
import { formatDate, getUserRoles, userHasAnyRole, cn, playNotificationSound } from '../../utils/helpers';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { totalUnread } = useUnreadMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchNotifs = () => {
        notificationsService.getNotifications(user.id).then(data => {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        });
      };
      fetchNotifs();

      const sub = notificationsService.subscribeToNotifications(user.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Notification;
          setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n));
          setNotifications(currentList => {
            setUnreadCount(currentList.filter(n => !n.is_read).length);
            return currentList;
          });
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          setNotifications(currentList => {
            setUnreadCount(currentList.filter(n => !n.is_read).length);
            return currentList;
          });
        }
      });
      return () => { sub.unsubscribe(); };
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (userHasAnyRole(user, ['super_admin'])) return '/superadmin';
    if (userHasAnyRole(user, ['admin'])) return '/admin';
    if (userHasAnyRole(user, ['moderator'])) return '/moderator';
    return '/dashboard';
  };

  const markAllRead = async () => {
    if (user) {
      await notificationsService.markAllRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
            {/* Logo + Categories */}
            <div className="flex items-center gap-2 shrink-0">
              <Link to={userHasAnyRole(user, ['moderator', 'admin', 'super_admin']) ? getDashboardPath() : "/"} className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shrink-0">
                  <Package size={18} className="text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-gradient hidden xs:inline sm:inline">All in one</span>
              </Link>

              {/* Categories dropdown (desktop) */}
              {!userHasAnyRole(user, ['moderator', 'admin', 'super_admin']) && (
                <div className="relative hidden lg:block">
                  <button
                    onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <Menu size={16} />
                    Categories
                    <ChevronDown size={14} />
                  </button>
                  <AnimatePresence>
                    {categoryMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50"
                        onMouseLeave={() => setCategoryMenuOpen(false)}
                      >
                        <div className="p-2 grid grid-cols-1 gap-0.5 max-h-96 overflow-y-auto">
                          {CATEGORIES.map(cat => (
                            <Link
                              key={cat.id}
                              to={`/category/${cat.slug}`}
                              onClick={() => setCategoryMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                                <Icon name={cat.icon} size={16} style={{ color: cat.color }} />
                              </div>
                              <span className="text-sm text-slate-700 dark:text-slate-300">{cat.name}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Search - Desktop inline search */}
            {!userHasAnyRole(user, ['moderator', 'admin', 'super_admin']) && (
              <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:block">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for anything..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-700 transition-all"
                  />
                </div>
              </form>
            )}

            {/* Right actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {user ? (
                <>
                  {/* Messages */}
                  {!userHasAnyRole(user, ['moderator', 'admin', 'super_admin']) && (
                    <Link
                      to="/chat"
                      className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                      title="Messages"
                    >
                      <MessageCircle size={18} />
                      {totalUnread > 0 && (
                        <motion.span
                          key={totalUnread}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-0.5"
                        >
                          {totalUnread > 9 ? '9+' : totalUnread}
                        </motion.span>
                      )}
                    </Link>
                  )}

                  {/* Notifications */}
                  <button
                    onClick={() => setNotifModalOpen(true)}
                    className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                    title="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Sell button */}
                  {!userHasAnyRole(user, ['moderator', 'admin', 'super_admin']) && (
                    <Link
                      to="/dashboard/listings/new"
                      className="btn-accent text-xs sm:text-sm py-1.5 px-2.5 sm:px-4 flex items-center gap-1.5 shadow-sm hover:shadow transition-all shrink-0"
                    >
                      <Plus size={16} />
                      <span className="hidden sm:inline font-semibold">Sell</span>
                    </Link>
                  )}

                  {/* Profile Menu Trigger */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className="flex items-center gap-1 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 shrink-0"
                    >
                      <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                      <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                    </button>

                    <AnimatePresence>
                      {profileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden"
                        >
                          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                            <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">{user.full_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                            {getUserRoles(user).length > 0 && (
                              <span className="badge bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 mt-1 capitalize">
                                {getUserRoles(user).map(role => role.replace('_', ' ')).join(', ')}
                              </span>
                            )}
                          </div>
                          <div className="p-1.5">
                            <Link
                              to={
                                userHasAnyRole(user, ['super_admin']) ? '/superadmin' :
                                userHasAnyRole(user, ['admin']) ? '/admin' :
                                userHasAnyRole(user, ['moderator']) ? '/moderator' :
                                '/dashboard'
                              }
                              onClick={() => setProfileMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                              <LayoutDashboard size={16} /> My Dashboard
                            </Link>

                            {!userHasAnyRole(user, ['moderator', 'admin', 'super_admin']) && (
                              <Link
                                to="/dashboard/bookmarks"
                                onClick={() => setProfileMenuOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                              >
                                <Heart size={16} /> Saved Listings
                              </Link>
                            )}

                            <button
                              onClick={toggleTheme}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                              {theme === 'dark' ? (
                                <><Sun size={16} /> Light Mode</>
                              ) : (
                                <><Moon size={16} /> Dark Mode</>
                              )}
                            </button>

                            <Link to="/profile" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                              <Settings size={16} /> Settings
                            </Link>

                            <hr className="my-1 border-slate-200 dark:border-slate-700" />
                            <button
                              onClick={() => { signOut(); setProfileMenuOpen(false); navigate('/'); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            >
                              <LogOut size={16} /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Mobile menu toggle */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0"
                  >
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link to="/login" className="btn-secondary text-xs sm:text-sm py-1.5 px-2.5 sm:px-4">Login</Link>
                  <Link to="/register" className="btn-primary text-xs sm:text-sm py-1.5 px-2.5 sm:px-4">Register</Link>
                  
                  <Link
                    to="/dashboard/listings/new"
                    className="btn-accent text-xs sm:text-sm py-1.5 px-2.5 sm:px-4 flex items-center gap-1 shadow-sm hover:shadow transition-all shrink-0"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline font-semibold">Sell</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Bar Row (Dedicated 2nd row below main header on mobile) */}
          {!userHasAnyRole(user, ['moderator', 'admin', 'super_admin']) && (
            <div className="pb-3 md:hidden">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for anything..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white dark:focus:bg-slate-700 transition-all"
                  />
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Mobile categories dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <div className="p-4 grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                {CATEGORIES.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Icon name={cat.icon} size={16} style={{ color: cat.color }} />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={notifModalOpen}
        onClose={() => setNotifModalOpen(false)}
        title="Notifications"
        size="md"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification(s)` : 'No new notifications'}
          </p>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-semibold text-primary-600 hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
          {notifications.length === 0 ? (
            <p className="text-center text-slate-500 py-8 text-sm">No notifications yet</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all cursor-pointer",
                  !n.is_read
                    ? "bg-primary-50/50 dark:bg-primary-950/10 border-primary-100 dark:border-primary-900/30"
                    : "bg-slate-50/30 dark:bg-slate-800/10 border-slate-100 dark:border-slate-850"
                )}
                onClick={async () => {
                  if (!n.is_read) {
                    await notificationsService.markRead(n.id);
                    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
                    setUnreadCount(prev => Math.max(0, prev - 1));
                  }
                }}
              >
                <div className="flex items-start gap-2.5">
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold text-slate-900 dark:text-slate-100", !n.is_read && "text-primary-850 dark:text-primary-400")}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
};

export default Header;
