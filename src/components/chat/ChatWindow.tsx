import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, CheckCheck, Wifi, WifiOff, Mic, Trash2, ArrowLeft, Shield, Lock, ChevronDown, Check, Phone } from 'lucide-react';
import { Message, Conversation } from '../../types';
import { chatService } from '../../services/chatService';
import { Avatar, Spinner } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';
import { formatDate, cn } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { AudioPlayer } from './AudioPlayer';
import { supabase } from '../../lib/supabase';

import { usePresence } from '../../contexts/PresenceContext';
import { useAudioCall } from '../../contexts/AudioCallContext';

interface ChatWindowProps {
  conversation: Conversation;
  onMessageSent?: () => void;
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onMessageSent, onBack }) => {
  const { user } = useAuth();
  const { isUserOnline } = usePresence();
  const { initiateCall } = useAudioCall();
  const { markConversationRead } = useUnreadMessages();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(true);
  const [activeActionMsg, setActiveActionMsg] = useState<Message | null>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);

  // The messages scroll container — we scroll THIS, not the page
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track IDs of messages we've already added locally (sent by this user)
  // so realtime events don't duplicate them
  const localMessageIds = useRef<Set<string>>(new Set());

  const otherUser = user?.id === conversation.buyer_id ? conversation.seller : conversation.buyer;

  // Use refs to store callback functions so that their changing references
  // don't trigger the main load useEffect
  const onMessageSentRef = useRef(onMessageSent);
  useEffect(() => {
    onMessageSentRef.current = onMessageSent;
  }, [onMessageSent]);

  const markConversationReadRef = useRef(markConversationRead);
  useEffect(() => {
    markConversationReadRef.current = markConversationRead;
  }, [markConversationRead]);

  /**
   * Scroll the MESSAGES CONTAINER to the bottom.
   * Never touches window.scrollTo or scrollIntoView (which would scroll the page).
   */
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (smooth) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    setMessages([]); // Clear messages immediately to avoid state leakage from previous conversation
    let channel: ReturnType<typeof chatService.subscribeToMessages>;

    const load = async () => {
      setLoading(true);
      localMessageIds.current.clear();
      try {
        const msgs = await chatService.getMessages(conversation.id);
        setMessages(msgs);
        if (user) {
          await chatService.markMessagesRead(conversation.id, user.id);
          markConversationReadRef.current(conversation.id);
        }
      } catch {
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
        // Instant scroll to bottom after paint
        requestAnimationFrame(() => scrollToBottom(false));
      }
    };

    load();

    // Supabase Realtime subscription for incoming and updated messages
    channel = chatService.subscribeToMessages(
      conversation.id,
      (msg) => {
        setMessages(prev => {
          // Skip if already present or locally added
          if (prev.some(m => m.id === msg.id)) return prev;
          if (localMessageIds.current.has(msg.id)) return prev;
          return [...prev, msg];
        });

        // Mark read if message is from the other person
        if (user && msg.sender_id !== user.id) {
          chatService.markMessagesRead(conversation.id, user.id);
          markConversationReadRef.current(conversation.id);
        }

        // Notify sidebar to refresh
        onMessageSentRef.current?.();
      },
      (updatedMsg) => {
        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m));
        onMessageSentRef.current?.();
      }
    );

    // Track connection status for the indicator
    channel.on('system' as any, {}, (payload: any) => {
      setConnected(payload?.status === 'ok' || true);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [conversation.id, user, scrollToBottom]);

  // Trigger mark read when user focuses window or tab becomes visible
  useEffect(() => {
    const handleFocus = () => {
      if (user && conversation.id && document.hasFocus() && document.visibilityState === 'visible') {
        chatService.markMessagesRead(conversation.id, user.id);
        markConversationReadRef.current(conversation.id);
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, conversation.id]);

  // Auto-scroll to bottom whenever messages array changes
  useEffect(() => {
    if (!loading) {
      scrollToBottom(true);
    }
  }, [messages, loading, scrollToBottom]);

  // Voice recording controls
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        await sendVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Failed to access microphone. Please allow microphone access.');
      console.error(err);
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      toast.success('Recording canceled');
    }
  };

  const sendVoiceMessage = async (blob: Blob) => {
    if (!user) return;
    setSending(true);
    setUploadingProgress(0);

    try {
      const fileExt = blob.type.split('/')[1]?.split(';')[0] || 'webm';
      const fileName = `voice_${Date.now()}.${fileExt}`;
      const filePath = `chat-audios/${conversation.id}/${fileName}`;

      setUploadingProgress(40);
      const { error } = await supabase.storage
        .from('listing-images')
        .upload(filePath, blob, {
          contentType: blob.type,
          cacheControl: '3600',
        });

      if (error) throw error;
      setUploadingProgress(85);

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      const content = `[audio]:${publicUrl}`;
      const msg = await chatService.sendMessage(conversation.id, user.id, content);

      localMessageIds.current.add(msg.id);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      onMessageSentRef.current?.();
    } catch (err: any) {
      toast.error('Failed to upload voice message: ' + err.message);
    } finally {
      setSending(false);
      setUploadingProgress(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      const isOtherOnline = isUserOnline(otherUser?.id, otherUser?.role);
      const msg = await chatService.sendMessage(conversation.id, user.id, content, isOtherOnline);
      // Track so realtime won't duplicate
      localMessageIds.current.add(msg.id);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      onMessageSentRef.current?.();
    } catch {
      toast.error('Failed to send message');
      setInput(content);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatRecordingTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Filter messages deleted for current user
  const visibleMessages = messages.filter(m => {
    if (!user) return true;
    const isDeletedLocally = typeof window !== 'undefined' && localStorage.getItem(`deleted_msg_${user.id}_${m.id}`) === 'true';
    const isDeletedInDb = Array.isArray(m.deleted_for_users) && m.deleted_for_users.includes(user.id);
    return !isDeletedLocally && !isDeletedInDb;
  });

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = [];
  visibleMessages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) last.messages.push(msg);
    else grouped.push({ date, messages: [msg] });
  });

  const isSystemChat = conversation.buyer?.role === 'moderator' || conversation.buyer?.role === 'admin' || conversation.buyer?.role === 'super_admin' ||
                       conversation.seller?.role === 'moderator' || conversation.seller?.role === 'admin' || conversation.seller?.role === 'super_admin';

  const isCurrentUserModerator = user?.role === 'moderator' || user?.role === 'admin' || user?.role === 'super_admin';
  const showReadOnlyFooter = isSystemChat && !isCurrentUserModerator;

  const showListingContext = (() => {
    if (!isSystemChat) return true;
    if (!conversation.listing) return false;
    return conversation.listing.title !== 'All in One System';
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden relative">

      {/* ── Header ── (fixed, never scrolls) */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-2 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-full transition-colors shrink-0 cursor-pointer flex items-center justify-center"
            title="Back to conversation list"
            aria-label="Back to conversation list"
          >
            <ArrowLeft size={22} className="text-slate-800 dark:text-slate-100 font-bold" />
          </button>
        )}
        {otherUser?.role === 'moderator' || otherUser?.role === 'admin' || otherUser?.role === 'super_admin' ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Shield size={20} className="animate-pulse" />
          </div>
        ) : (
          <div className="relative shrink-0">
            <Avatar src={otherUser?.avatar_url} name={otherUser?.full_name || ''} size="md" />
            <span className={cn(
              "absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-800 rounded-full",
              isUserOnline(otherUser?.id, otherUser?.role) ? "bg-emerald-500" : "bg-slate-400"
            )} title={isUserOnline(otherUser?.id, otherUser?.role) ? "Online" : "Offline"} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight flex items-center gap-1.5">
            {otherUser?.role === 'moderator' || otherUser?.role === 'admin' || otherUser?.role === 'super_admin' ? 'All in One' : otherUser?.full_name}
            {(otherUser?.role === 'moderator' || otherUser?.role === 'admin' || otherUser?.role === 'super_admin') && (
              <span className="text-[9px] px-1.5 py-0.5 bg-blue-600 dark:bg-blue-500 text-white rounded font-bold uppercase tracking-wider shrink-0">
                System / Admin
              </span>
            )}
          </p>
          {conversation.listing && showListingContext && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              Re: {conversation.listing.title}
            </p>
          )}
        </div>

        {/* Presence indicator */}
        {isUserOnline(otherUser?.id, otherUser?.role) ? (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Offline</span>
          </div>
        )}

        {/* Audio Call Button */}
        {otherUser && (
          <button
            type="button"
            onClick={() => {
              const isOtherOnline = isUserOnline(otherUser.id, otherUser.role);
              if (!isOtherOnline) {
                toast.error('User is offline');
                return;
              }
              initiateCall({
                id: otherUser.id,
                full_name: otherUser.full_name || 'User',
                avatar_url: otherUser.avatar_url,
              }, conversation.id);
            }}
            className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded-full transition-colors shrink-0 cursor-pointer flex items-center justify-center ml-1"
            title="Start Audio Call"
            aria-label="Start Audio Call"
          >
            <Phone size={19} />
          </button>
        )}
      </div>

      {/* ── Listing preview banner ── (shrink-0) */}
      {conversation.listing && showListingContext && (
        <div className="shrink-0 px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            {conversation.listing.images?.[0] && (
              <img
                src={conversation.listing.images[0]}
                alt={conversation.listing.title}
                className="w-11 h-9 object-cover rounded-lg shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate leading-tight">
                {conversation.listing.title}
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                PKR {conversation.listing.price?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Messages ── (flex-1 + overflow-y-auto = only THIS scrolls) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 scroll-smooth"
        style={{ overscrollBehavior: 'contain' }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
              <ImageIcon size={22} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No messages yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Send the first message!</p>
          </div>
        ) : grouped.map(({ date, messages: dayMsgs }) => (
          <div key={date}>
            {/* Date divider */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap px-2 bg-white dark:bg-slate-900 relative">
                {date}
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <AnimatePresence initial={false}>
              {dayMsgs.map((msg, idx) => {
                const isMine = msg.sender_id === user?.id;
                const prevMsg = dayMsgs[idx - 1];
                const nextMsg = dayMsgs[idx + 1];
                const isGroupStart = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                const isGroupEnd = !nextMsg || nextMsg.sender_id !== msg.sender_id;
                const showAvatar = !isMine && isGroupStart;
                const isVoiceMessage = msg.content.startsWith('[audio]:');

                const isSystem = msg.sender?.role === 'moderator' || msg.sender?.role === 'admin' || msg.sender?.role === 'super_admin';

                if (isSystem) {
                  return (
                    <motion.div
                      key={msg.id}
                      layout
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                      className="flex justify-start w-full mb-3"
                    >
                      <div className="w-7 shrink-0 self-start">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm shrink-0">
                          <Shield size={12} />
                        </div>
                      </div>

                      <div className="flex-1 max-w-[85%] bg-gradient-to-r from-blue-50 to-indigo-50/20 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-2 border-b border-blue-100/50 dark:border-blue-900/10 pb-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">All in One</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-600 dark:bg-blue-500 text-white rounded font-bold uppercase tracking-wider shrink-0">
                            System Message
                          </span>
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1 mt-2 justify-end">
                          <span className="text-[9px] text-slate-450 dark:text-slate-400">{formatDate(msg.created_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                // Render deleted message bubble
                if (msg.is_deleted || msg.content === 'This message was deleted.') {
                  return (
                    <motion.div
                      key={msg.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        'flex gap-2 mb-1.5',
                        isMine ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div className="px-3.5 py-1.5 text-xs italic text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl flex items-center gap-1.5 border border-slate-200/50 dark:border-slate-700/50">
                        <Trash2 size={12} className="text-slate-400 shrink-0" />
                        <span>This message was deleted.</span>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className={cn(
                      'flex gap-2 group/msg',
                      isMine ? 'justify-end' : 'justify-start',
                      isGroupEnd ? 'mb-3' : 'mb-0.5'
                    )}
                  >
                    {/* Other user avatar space */}
                    {!isMine && (
                      <div className="w-7 shrink-0 self-end pb-0.5">
                        {showAvatar ? (
                          <Avatar src={msg.sender?.avatar_url} name={msg.sender?.full_name || ''} size="xs" />
                        ) : null}
                      </div>
                    )}

                    <div className={cn(
                      'max-w-[75%] flex items-center gap-1',
                      isMine ? 'flex-row' : 'flex-row-reverse'
                    )}>
                      {/* Delete action button */}
                      <button
                        type="button"
                        onClick={() => setActiveActionMsg(msg)}
                        className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded shrink-0 cursor-pointer"
                        title="Delete options"
                      >
                        <ChevronDown size={14} />
                      </button>

                      <div className={cn(
                        'flex flex-col',
                        isMine ? 'items-end' : 'items-start'
                      )}>
                        {isVoiceMessage ? (
                          <AudioPlayer src={msg.content.slice(8)} isMine={isMine} />
                        ) : (
                          <div className={cn(
                            'px-3.5 py-2 text-sm leading-relaxed break-words',
                            isMine
                              ? [
                                  'bg-primary-600 text-white',
                                  isGroupStart ? 'rounded-t-2xl rounded-l-2xl rounded-br-sm' : 'rounded-l-2xl rounded-r-sm',
                                  isGroupEnd && 'rounded-b-2xl',
                               ]
                              : [
                                  'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm',
                                  isGroupStart ? 'rounded-t-2xl rounded-r-2xl rounded-bl-sm' : 'rounded-r-2xl rounded-l-sm',
                                  isGroupEnd && 'rounded-b-2xl',
                               ]
                          )}>
                            {msg.content}
                          </div>
                        )}

                        {/* Timestamp + read receipt */}
                        {isGroupEnd && (
                          <div className={cn(
                            'flex items-center gap-1 mt-1 px-0.5',
                            isMine ? 'justify-end' : 'justify-start'
                          )}>
                            <span className="text-[10px] text-slate-400">{formatDate(msg.created_at)}</span>
                            {isMine && (
                              msg.is_read ? (
                                <CheckCheck size={14} className="text-blue-500 font-bold shrink-0" title="Seen" />
                              ) : (msg.is_delivered || (otherUser && isUserOnline(otherUser.id, otherUser.role))) ? (
                                <CheckCheck size={14} className="text-slate-400 shrink-0" title="Delivered" />
                              ) : (
                                <Check size={14} className="text-slate-400 shrink-0" title="Sent" />
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* ── Delete Options Modal (WhatsApp Style) ── */}
      {activeActionMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-xs w-full p-4 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
              Delete message?
            </h3>

            {activeActionMsg.sender_id === user?.id && !activeActionMsg.is_deleted && activeActionMsg.content !== 'This message was deleted.' && (
              <button
                type="button"
                onClick={async () => {
                  const target = activeActionMsg;
                  setActiveActionMsg(null);
                  try {
                    await chatService.deleteMessageForEveryone(target.id);
                    setMessages(prev => prev.map(m => m.id === target.id ? { ...m, is_deleted: true, content: 'This message was deleted.' } : m));
                    toast.success('Deleted for everyone');
                    onMessageSentRef.current?.();
                  } catch {
                    toast.error('Failed to delete message');
                  }
                }}
                className="w-full text-left py-2.5 px-3 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Delete for Everyone</span>
                <Trash2 size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                const target = activeActionMsg;
                setActiveActionMsg(null);
                if (user) {
                  try {
                    await chatService.deleteMessageForMe(target.id, user.id);
                    setMessages(prev => prev.filter(m => m.id !== target.id));
                    toast.success('Deleted for me');
                    onMessageSentRef.current?.();
                  } catch {
                    toast.error('Failed to delete message');
                  }
                }
              }}
              className="w-full text-left py-2.5 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>Delete for Me</span>
              <Trash2 size={16} />
            </button>

            <button
              type="button"
              onClick={() => setActiveActionMsg(null)}
              className="w-full text-center py-2 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* Uploading progress overlay */}
      {uploadingProgress !== null && (
        <div className="shrink-0 px-4 py-1.5 bg-primary-50 dark:bg-primary-950/20 text-xs text-primary-600 dark:text-primary-400 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
          <div className="w-3.5 h-3.5 border-2 border-primary-600/30 border-t-primary-600 rounded-full animate-spin shrink-0" />
          <span>Sending voice message... ({uploadingProgress}%)</span>
        </div>
      )}

      {/* ── Input footer ── */}
      {showReadOnlyFooter ? (
        <div className="shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto border border-slate-200/50 dark:border-slate-750">
            <Lock size={14} className="text-slate-450 dark:text-slate-500 shrink-0" />
            <span>This is an official system channel. You cannot reply directly to <strong>All in One</strong> system messages.</span>
          </div>
        </div>
      ) : (
        <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400/30 transition-all px-2.5 py-1">
            
            {isRecording ? (
              // Recording UI
              <div className="flex-1 flex items-center justify-between py-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Recording: {formatRecordingTime(recordingTime)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={cancelRecording}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    title="Cancel Recording"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={stopAndSendRecording}
                    className="px-3.5 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all"
                  >
                    <Send size={12} />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ) : (
              // Standard Input UI
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent px-2.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                  disabled={sending}
                  autoFocus
                />
                
                <div className="flex items-center shrink-0">
                  {input.trim() === '' ? (
                    <motion.button
                      onClick={startRecording}
                      disabled={sending}
                      whileTap={{ scale: 0.9 }}
                      className="w-9 h-9 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center justify-center transition-colors"
                      title="Record voice message"
                    >
                      <Mic size={18} />
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      whileTap={{ scale: 0.88 }}
                      className="w-9 h-9 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
                    >
                      {sending ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={15} />
                      )}
                    </motion.button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatWindow;
