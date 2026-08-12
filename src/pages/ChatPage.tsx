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

import { usePresence } from '../contexts/PresenceContext';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { isUserOnline } = usePresence();
  const { markConversationRead } = useUnreadMessages();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const selectedIdRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  // Keep ref in sync for realtime callbacks and persist selection
  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null;
    if (selected?.id) {
      try {
        localStorage.setItem('active_chat_conv_id', selected.id);
      } catch {}
    }
  }, [selected]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await chatService.getConversations(user.id);
      
      // Sort conversations by the actual most recent last_message timestamp (WhatsApp style)
      const sorted = [...data].sort((a, b) => {
        const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.updated_at || a.created_at).getTime();
        const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      }).map(c => {
        if (selectedIdRef.current && c.id === selectedIdRef.current) {
          return { ...c, unread_count: 0 };
        }
        return c;
      });

      setConversations(sorted);

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        const savedConvId = searchParams.get('conv') || (typeof window !== 'undefined' ? localStorage.getItem('active_chat_conv_id') : null);
        if (savedConvId) {
          const found = sorted.find(c => c.id === savedConvId);
          if (found) {
            setSelected(found);
            return;
          }
        }
        if (!isMobile && sorted.length > 0) {
          setSelected(sorted[0]);
        }
      } else {
        // Subsequent re-fetches (e.g. real-time messages, tab switches)
        if (selectedIdRef.current) {
          const refreshed = sorted.find(c => c.id === selectedIdRef.current);
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
    loadConversations();

    const channel = chatService.subscribeToConversations(user.id, () => {
      loadConversations();
    });

    return () => { channel.unsubscribe(); };
  }, [user]);

  // Handle browser back button on mobile to return to conversation list
  useEffect(() => {
    const handlePopState = () => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      if (isMobile && selectedIdRef.current) {
        setSelected(null);
        try {
          localStorage.removeItem('active_chat_conv_id');
        } catch {}
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectConversation = (conv: Conversation, targetMsgId?: string) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile && !selected) {
      try {
        window.history.pushState({ chatOpen: true }, '');
      } catch {}
    }
    setSelected(conv);
    const params: Record<string, string> = { conv: conv.id };
    if (targetMsgId) {
      params.msg = targetMsgId;
    }
    setSearchParams(params, { replace: true });
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
     * Mobile header height is 108px (2 rows with search bar).
     * Desktop header height is 64px (top-16).
     * Using top-[108px] md:top-16 ensures ChatWindow header & Back Arrow are never cut off.
     */
    <div className="fixed inset-0 top-[108px] md:top-16 bottom-0 flex bg-white dark:bg-slate-900 overflow-hidden">
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

                let rawMsgContent = conv.last_message?.content || '';
                if (rawMsgContent.startsWith('[reply:')) {
                  const cIdx = rawMsgContent.indexOf(']:');
                  if (cIdx !== -1) rawMsgContent = rawMsgContent.slice(cIdx + 2);
                }
                const lastMsgText = rawMsgContent.startsWith('[audio]:')
                  ? '🎤 Voice message'
                  : rawMsgContent;

                return (
                  <motion.button
                    key={conv.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleSelectConversation(conv, conv.last_message?.id)}
                    className={cn(
                      'w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors border-b border-slate-100 dark:border-slate-800/60 cursor-pointer',
                      isSelected && 'bg-primary-50/80 dark:bg-primary-900/20'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        {other?.role === 'moderator' || other?.role === 'admin' || other?.role === 'super_admin' ? (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                            <Shield size={20} />
                          </div>
                        ) : (
                          <Avatar src={other?.avatar_url} name={other?.full_name || ''} size="md" />
                        )}
                        <span className={cn(
                          "absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full transition-colors",
                          isUserOnline(other?.id, other?.role) ? "bg-emerald-500" : "bg-slate-400"
                        )} title={isUserOnline(other?.id, other?.role) ? "Online" : "Offline"} />
                        {hasUnread && (
                          <motion.span
                            key={conv.unread_count}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 min-w-[18px] h-4.5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none px-1 shadow-sm"
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
                              : 'font-semibold text-slate-800 dark:text-slate-200'
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
                          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium truncate mt-0.5">
                            {truncate(conv.listing.title, 32)}
                          </p>
                        )}
                        {conv.last_message && (
                          <p className={cn(
                            'text-xs truncate mt-0.5',
                            hasUnread
                              ? 'text-slate-900 dark:text-slate-100 font-semibold'
                              : 'text-slate-400 dark:text-slate-500'
                          )}>
                            {conv.last_message.sender_id === user.id ? 'You: ' : ''}
                            {lastMsgText}
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
            onMessageSent={() => loadConversations()}
            onBack={() => {
              setSelected(null);
              try {
                localStorage.removeItem('active_chat_conv_id');
              } catch {}
              setSearchParams({}, { replace: true });
            }}
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
