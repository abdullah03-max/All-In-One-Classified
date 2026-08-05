import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Search, Shield } from 'lucide-react';
import { chatService } from '../services/chatService';
import { Conversation } from '../types';
import ChatWindow from '../components/chat/ChatWindow';
import { Avatar, Spinner, EmptyState } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadMessages } from '../contexts/UnreadMessagesContext';
import { formatDate, cn, truncate } from '../utils/helpers';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { markConversationRead } = useUnreadMessages();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const selectedIdRef = useRef<string | null>(null);

  // Keep ref in sync for realtime callbacks
  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null;
  }, [selected]);

  const loadConversations = useCallback(async (preserveSelection = true) => {
    if (!user) return;
    try {
      const data = await chatService.getConversations(user.id);
      setConversations(data);

      if (!preserveSelection) {
        const convId = searchParams.get('conv');
        if (convId) {
          const found = data.find(c => c.id === convId);
          if (found) setSelected(found);
        } else if (data.length > 0) {
          setSelected(data[0]);
        }
      } else {
        if (selectedIdRef.current) {
          const refreshed = data.find(c => c.id === selectedIdRef.current);
          if (refreshed) {
            setSelected(prev => prev ? { ...prev, ...refreshed } : refreshed);
          }
        }
      }
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (!user) return;
    loadConversations(false);

    const channel = chatService.subscribeToConversations(user.id, () => {
      loadConversations(true);
    });

    return () => { channel.unsubscribe(); };
  }, [user, loadConversations]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelected(conv);
    // Clear unread locally immediately
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
    );
    // Trigger global badge update
    markConversationRead(conv.id);
  };

  const filtered = conversations.filter(conv => {
    const other = user?.id === conv.buyer_id ? conv.seller : conv.buyer;
    return other?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.listing?.title?.toLowerCase().includes(search.toLowerCase());
  });

  if (!user) return null;

  return (
    /**
     * KEY LAYOUT FIX:
     * Use fixed positioning pinned to viewport edges, UNDER the sticky header (top-16).
     * This prevents any page-level scroll while the chat is open.
     * The messages container inside ChatWindow gets its own overflow-y-auto scroll.
     */
    <div className="fixed inset-0 top-16 bottom-0 flex bg-white dark:bg-slate-900 overflow-hidden">
      {/* ── Sidebar ── */}
      <div className={cn(
        "w-full md:w-72 shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900",
        selected ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 text-base">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>

        {/* Conversation list — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              No conversations yet
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map(conv => {
                const other = user.id === conv.buyer_id ? conv.seller : conv.buyer;
                const isSelected = selected?.id === conv.id;
                const hasUnread = (conv.unread_count || 0) > 0;

                const isSystem = conv.buyer?.role === 'moderator' || conv.buyer?.role === 'admin' || conv.buyer?.role === 'super_admin' ||
                                 conv.seller?.role === 'moderator' || conv.seller?.role === 'admin' || conv.seller?.role === 'super_admin';

                const showListingContext = (() => {
                  if (!isSystem) return true;
                  if (!conv.listing) return false;
                  return conv.listing.title !== 'All in One System';
                })();

                return (
                  <motion.button
                    key={conv.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleSelectConversation(conv)}
                    className={cn(
                      'w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-700/50',
                      isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                       <div className="relative shrink-0">
                        {other?.role === 'moderator' || other?.role === 'admin' || other?.role === 'super_admin' ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                            <Shield size={18} />
                          </div>
                        ) : (
                          <Avatar src={other?.avatar_url} name={other?.full_name || ''} size="sm" />
                        )}
                        {hasUnread && (
                          <motion.span
                            key={conv.unread_count}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-0.5"
                          >
                            {conv.unread_count! > 9 ? '9+' : conv.unread_count}
                          </motion.span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={cn(
                            'text-sm truncate flex items-center gap-1.5',
                            hasUnread
                              ? 'font-bold text-slate-900 dark:text-slate-100'
                              : 'font-medium text-slate-700 dark:text-slate-300'
                          )}>
                            {other?.role === 'moderator' || other?.role === 'admin' || other?.role === 'super_admin' ? 'All in One' : other?.full_name}
                            {(other?.role === 'moderator' || other?.role === 'admin' || other?.role === 'super_admin') && (
                              <span className="text-[8px] px-1 py-0.5 bg-blue-600 text-white rounded font-bold uppercase shrink-0">
                                System
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {conv.last_message ? formatDate(conv.last_message.created_at) : ''}
                          </span>
                        </div>
                        {conv.listing && showListingContext && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {truncate(conv.listing.title, 30)}
                          </p>
                        )}
                        {conv.last_message && (
                          <p className={cn(
                            'text-xs truncate mt-0.5',
                            hasUnread
                              ? 'text-slate-800 dark:text-slate-200 font-semibold'
                              : 'text-slate-400 dark:text-slate-500'
                          )}>
                            {conv.last_message.sender_id === user.id ? 'You: ' : ''}
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ── Chat window — fills remaining space ── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950",
        selected ? "flex" : "hidden md:flex"
      )}>
        {selected ? (
          <ChatWindow
            key={selected.id}
            conversation={selected}
            onMessageSent={() => loadConversations(true)}
            onBack={() => setSelected(null)}
          />
        ) : (
          <EmptyState
            icon={<MessageCircle size={28} />}
            title="Select a conversation"
            description="Choose a conversation from the list to start chatting"
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;
