import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, CheckCheck, Wifi, WifiOff, Mic, Trash2, ArrowLeft, Shield, Lock, ChevronDown, Check, Phone, Reply, X, CornerDownRight } from 'lucide-react';
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

interface ReplyInfo {
  replyToId: string;
  replyToSender: string;
  replyToText: string;
}

function parseMessageReply(content: string): { reply: ReplyInfo | null; cleanContent: string } {
  if (!content || !content.startsWith('[reply:')) {
    return { reply: null, cleanContent: content || '' };
  }
  const closingIdx = content.indexOf(']:');
  if (closingIdx === -1) {
    return { reply: null, cleanContent: content };
  }
  const metaStr = content.slice(7, closingIdx);
  const cleanContent = content.slice(closingIdx + 2);
  const parts = metaStr.split('|');
  if (parts.length < 3) {
    return { reply: null, cleanContent: content };
  }
  return {
    reply: {
      replyToId: parts[0],
      replyToSender: parts[1],
      replyToText: parts.slice(2).join('|'),
    },
    cleanContent,
  };
}

function formatMessageReply(originalMsg: Message, textContent: string): string {
  const senderName = originalMsg.sender?.full_name || 'User';
  const parsed = parseMessageReply(originalMsg.content);
  let preview = parsed.cleanContent;

  if (preview.startsWith('[audio]:')) {
    preview = '🎤 Voice message';
  } else if (preview.startsWith('[Image]') || preview.startsWith('http')) {
    preview = '📷 Photo';
  } else if (preview.length > 45) {
    preview = preview.slice(0, 45) + '...';
  }

  const safeSender = senderName.replace(/[|\]]/g, ' ');
  const safePreview = preview.replace(/[|\]]/g, ' ');
  return `[reply:${originalMsg.id}|${safeSender}|${safePreview}]:${textContent}`;
}

function getReplyPreviewText(msg: Message): string {
  const parsed = parseMessageReply(msg.content);
  let text = parsed.cleanContent;
  if (text.startsWith('[audio]:')) return '🎤 Voice message';
  if (text.startsWith('[Image]') || text.startsWith('http')) return '📷 Photo';
  return text;
}

interface ChatWindowProps {
  conversation: Conversation;
  onMessageSent?: () => void;
  onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onMessageSent, onBack }) => {
  const { user } = useAuth();
  const { isUserOnline } = usePresence();
  const { markConversationRead } = useUnreadMessages();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(true);
  const [activeActionMsg, setActiveActionMsg] = useState<Message | null>(null);

  // Reply states
  const [replyingToMsg, setReplyingToMsg] = useState<Message | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Centralized Voice Message Playback Manager
  const [activeVoiceMsgId, setActiveVoiceMsgId] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const handleToggleVoicePlay = useCallback((msgId: string) => {
    setActiveVoiceMsgId(prevId => {
      if (prevId === msgId) {
        setIsPlayingVoice(prevPlaying => !prevPlaying);
        return msgId;
      } else {
        setIsPlayingVoice(true);
        return msgId;
      }
    });
  }, []);

  const handleVoiceEnded = useCallback((finishedMsgId: string) => {
    setMessages(currentMessages => {
      const visible = currentMessages.filter(m => {
        if (!user) return true;
        const isDeletedLocally = typeof window !== 'undefined' && localStorage.getItem(`deleted_msg_${user.id}_${m.id}`) === 'true';
        const isDeletedInDb = Array.isArray(m.deleted_for_users) && m.deleted_for_users.includes(user.id);
        return !isDeletedLocally && !isDeletedInDb;
      });

      const currentIndex = visible.findIndex(m => m.id === finishedMsgId);
      if (currentIndex !== -1 && currentIndex < visible.length - 1) {
        const nextMsg = visible[currentIndex + 1];
        const parsed = parseMessageReply(nextMsg.content);
        const isNextVoice = parsed.cleanContent.startsWith('[audio]:');

        if (isNextVoice) {
          console.log('[Voice Message Debug] Auto-advancing to next consecutive voice message:', nextMsg.id);
          setActiveVoiceMsgId(nextMsg.id);
          setIsPlayingVoice(true);
          return currentMessages;
        }
      }

      console.log('[Voice Message Debug] Reached text message or end of group. Stopping playback.');
      setActiveVoiceMsgId(null);
      setIsPlayingVoice(false);
      return currentMessages;
    });
  }, [user]);

  // Voice recording states
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'preview' | 'sending'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedWaveform, setRecordedWaveform] = useState<number[]>([]);
  const [, setUploadingProgress] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const isRecordingCanceledRef = useRef(false);

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

  /**
   * Scroll to specific target message (e.g. quoted reply or voice message preview)
   */
  const scrollToOriginalMessage = useCallback((msgId: string) => {
    if (!msgId) return;
    const targetElement = document.getElementById(`msg-${msgId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 2200);
    } else {
      setTimeout(() => {
        const el = document.getElementById(`msg-${msgId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedMsgId(msgId);
          setTimeout(() => setHighlightedMsgId(null), 2200);
        }
      }, 180);
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
      },
      (readerId) => {
        if (user && readerId !== user.id) {
          setMessages(prev => prev.map(m => m.sender_id === user.id ? { ...m, is_read: true, is_delivered: true } : m));
        }
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

  // Auto-scroll to target message (e.g. voice message preview) or bottom
  useEffect(() => {
    if (!loading && messages.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const targetMsgId = urlParams.get('msg');
      if (targetMsgId) {
        setTimeout(() => {
          scrollToOriginalMessage(targetMsgId);
        }, 180);
      } else {
        scrollToBottom(true);
      }
    }
  }, [messages, loading, scrollToBottom, scrollToOriginalMessage]);

  // Extract amplitude bars from audio blob
  const extractWaveformFromBlob = async (blob: Blob): Promise<number[]> => {
    let audioCtx: AudioContext | null = null;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const rawData = decoded.getChannelData(0);
      const samples = 32;
      const blockSize = Math.floor(rawData.length / samples);
      const bars: number[] = [];
      for (let i = 0; i < samples; i++) {
        const start = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[start + j]);
        }
        bars.push(sum / blockSize);
      }
      const maxVal = Math.max(...bars, 0.001);
      return bars.map(b => Math.max(12, Math.round((b / maxVal) * 100)));
    } catch {
      return [
        25, 45, 75, 35, 60, 90, 50, 30, 65, 80, 95, 40, 70, 85, 30, 55,
        75, 40, 60, 85, 95, 50, 35, 70, 80, 45, 60, 30, 50, 35, 20, 15
      ];
    } finally {
      if (audioCtx && audioCtx.state !== 'closed') {
        try { await audioCtx.close(); } catch {}
      }
    }
  };

  // 1. IDLE -> RECORDING
  const startRecording = async () => {
    try {
      isRecordingCanceledRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (!isRecordingCanceledRef.current && event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (isRecordingCanceledRef.current) {
          audioChunksRef.current = [];
          return;
        }
        if (audioChunksRef.current.length === 0) {
          setVoiceState('idle');
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const previewUrl = URL.createObjectURL(blob);
        const wf = await extractWaveformFromBlob(blob);

        setRecordedBlob(blob);
        setRecordedAudioUrl(previewUrl);
        setRecordedWaveform(wf);
        setVoiceState('preview');
      };

      mediaRecorder.start();
      setVoiceState('recording');
      setRecordingTime(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Failed to access microphone. Please allow microphone access.');
      console.error(err);
    }
  };

  // 2. RECORDING -> PREVIEW (STOP button only stops and moves to preview)
  const stopRecordingToPreview = () => {
    if (mediaRecorderRef.current && voiceState === 'recording') {
      isRecordingCanceledRef.current = false;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      mediaRecorderRef.current.stop();
    }
  };

  // 3. PREVIEW or RECORDING -> IDLE (DELETE button discards recording)
  const deleteRecordingPreview = () => {
    isRecordingCanceledRef.current = true;
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
    }
    setRecordedBlob(null);
    setRecordedAudioUrl(null);
    setRecordedWaveform([]);
    setVoiceState('idle');
    setRecordingTime(0);
  };

  // 4. PREVIEW -> SENDING -> SENT -> IDLE (SEND button uploads and sends)
  const sendRecordingPreview = async () => {
    if (!user || !recordedBlob) return;
    setVoiceState('sending');
    setSending(true);
    setUploadingProgress(0);

    try {
      const rawType = recordedBlob.type || 'audio/webm';
      const mimeType = rawType.split(';')[0].trim();
      let fileExt = 'webm';
      if (mimeType.includes('mp4') || mimeType.includes('aac')) fileExt = 'mp4';
      else if (mimeType.includes('ogg')) fileExt = 'ogg';
      else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) fileExt = 'mp3';

      const fileName = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `chat-audios/${conversation.id}/${fileName}`;

      setUploadingProgress(40);
      const { error: uploadErr } = await supabase.storage
        .from('listing-images')
        .upload(filePath, recordedBlob, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadErr) throw uploadErr;
      setUploadingProgress(85);

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      const wfString = recordedWaveform.join(',');
      const audioUrlWithWf = `${publicUrl}?wf=${wfString}`;
      const rawAudioContent = `[audio]:${audioUrlWithWf}`;
      const finalContent = replyingToMsg ? formatMessageReply(replyingToMsg, rawAudioContent) : rawAudioContent;
      setReplyingToMsg(null);

      const msg = await chatService.sendMessage(conversation.id, user.id, finalContent);

      localMessageIds.current.add(msg.id);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      onMessageSentRef.current?.();
    } catch (err: any) {
      console.error('[Voice Message Debug] Failed to send voice message:', err);
      toast.error('Failed to upload voice message: ' + (err.message || 'Error'));
    } finally {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      setRecordedBlob(null);
      setRecordedAudioUrl(null);
      setRecordedWaveform([]);
      setVoiceState('idle');
      setSending(false);
      setUploadingProgress(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;
    const textContent = input.trim();
    const finalContent = replyingToMsg ? formatMessageReply(replyingToMsg, textContent) : textContent;
    setInput('');
    setReplyingToMsg(null);
    setSending(true);

    try {
      const isOtherOnline = isUserOnline(otherUser?.id, otherUser?.role);
      const msg = await chatService.sendMessage(conversation.id, user.id, finalContent, isOtherOnline);
      // Track so realtime won't duplicate
      localMessageIds.current.add(msg.id);
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      onMessageSentRef.current?.();
    } catch {
      toast.error('Failed to send message');
      setInput(textContent);
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

                const parsedMsg = parseMessageReply(msg.content);
                const displayContent = parsedMsg.cleanContent;
                const isVoiceMessage = displayContent.startsWith('[audio]:');

                return (
                  <motion.div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    layout
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 50 }}
                    dragElastic={0.15}
                    onDragEnd={(_e, info) => {
                      if (info.offset.x > 35) {
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                          navigator.vibrate(30);
                        }
                        setReplyingToMsg(msg);
                      }
                    }}
                    className={cn(
                      'flex gap-2 group/msg relative transition-colors duration-500 rounded-xl p-0.5',
                      highlightedMsgId === msg.id && 'bg-primary-500/25 ring-2 ring-primary-500/50',
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
                      {/* Action buttons (Delete & Reply) */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setReplyingToMsg(msg)}
                          className="p-1 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="Reply"
                        >
                          <Reply size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveActionMsg(msg)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="Delete options"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      <div className={cn(
                        'flex flex-col',
                        isMine ? 'items-end' : 'items-start'
                      )}>
                        {isVoiceMessage ? (
                          <div className="flex flex-col gap-1">
                            {/* Quoted Message Card if replying */}
                            {parsedMsg.reply && (
                              <div
                                onClick={() => scrollToOriginalMessage(parsedMsg.reply!.replyToId)}
                                className={cn(
                                  'px-2.5 py-1.5 rounded-xl border-l-3 text-xs cursor-pointer transition-colors shadow-xs',
                                  isMine
                                    ? 'bg-primary-700/60 border-primary-300 text-white hover:bg-primary-700/80'
                                    : 'bg-slate-100 dark:bg-slate-800 border-primary-500 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                                )}
                              >
                                <div className="font-semibold text-[11px] text-primary-500 dark:text-primary-400">
                                  {parsedMsg.reply.replyToSender}
                                </div>
                                <p className="truncate text-[11px] opacity-80 font-normal">
                                  {parsedMsg.reply.replyToText}
                                </p>
                              </div>
                            )}
                            <AudioPlayer
                              msgId={msg.id}
                              src={displayContent.slice(8)}
                              isMine={isMine}
                              activeVoiceMsgId={activeVoiceMsgId}
                              isPlayingVoice={isPlayingVoice}
                              onTogglePlay={handleToggleVoicePlay}
                              onVoiceEnded={handleVoiceEnded}
                            />
                          </div>
                        ) : (
                          <div className={cn(
                            'px-3.5 py-2 text-sm leading-relaxed break-words shadow-xs',
                            isMine
                              ? [
                                  'bg-primary-600 text-white',
                                  isGroupStart ? 'rounded-t-2xl rounded-l-2xl rounded-br-sm' : 'rounded-l-2xl rounded-r-sm',
                                  isGroupEnd && 'rounded-b-2xl',
                               ]
                              : [
                                  'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs',
                                  isGroupStart ? 'rounded-t-2xl rounded-r-2xl rounded-bl-sm' : 'rounded-r-2xl rounded-l-sm',
                                  isGroupEnd && 'rounded-b-2xl',
                               ]
                          )}>
                            {/* Quoted Message Card inside Bubble */}
                            {parsedMsg.reply && (
                              <div
                                onClick={() => scrollToOriginalMessage(parsedMsg.reply!.replyToId)}
                                className={cn(
                                  'mb-1.5 px-2.5 py-1.5 rounded-xl border-l-3 text-xs cursor-pointer transition-all',
                                  isMine
                                    ? 'bg-black/15 border-white/70 text-white hover:bg-black/25'
                                    : 'bg-slate-100 dark:bg-slate-800/80 border-primary-500 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750'
                                )}
                              >
                                <div className={cn(
                                  'font-semibold text-[11px]',
                                  isMine ? 'text-primary-100' : 'text-primary-600 dark:text-primary-400'
                                )}>
                                  {parsedMsg.reply.replyToSender}
                                </div>
                                <p className="truncate text-[11px] opacity-90 font-normal mt-0.5">
                                  {parsedMsg.reply.replyToText}
                                </p>
                              </div>
                            )}
                            {displayContent}
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
                              (msg.is_read || messages.some(m => m.sender_id !== user?.id && new Date(m.created_at).getTime() >= new Date(msg.created_at).getTime())) ? (
                                <span title="Seen"><CheckCheck size={14} className="text-blue-500 font-bold shrink-0" /></span>
                              ) : (msg.is_delivered || (otherUser && isUserOnline(otherUser.id, otherUser.role))) ? (
                                <span title="Delivered"><CheckCheck size={14} className="text-slate-400 shrink-0" /></span>
                              ) : (
                                <span title="Sent"><Check size={14} className="text-slate-400 shrink-0" /></span>
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
          
          {/* Reply Preview Banner (WhatsApp Style) */}
          <AnimatePresence>
            {replyingToMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-900 border-l-4 border-primary-500 rounded-r-xl mb-2 shadow-xs"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400">
                    <Reply size={12} />
                    <span>Replying to {replyingToMsg.sender?.full_name || 'User'}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5 font-medium">
                    {getReplyPreviewText(replyingToMsg)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingToMsg(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Cancel reply"
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400/30 transition-all px-2.5 py-1">
            
            {voiceState === 'recording' ? (
              // Recording UI
              <div className="flex-1 flex items-center justify-between py-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Recording: {formatRecordingTime(recordingTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteRecordingPreview();
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Cancel Recording"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopRecordingToPreview();
                    }}
                    className="px-3.5 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Stop and Preview"
                  >
                    <span className="w-2.5 h-2.5 bg-white rounded-xs" />
                    <span>Stop</span>
                  </button>
                </div>
              </div>
            ) : voiceState === 'preview' ? (
              // Preview UI (After stopping recording)
              <div className="flex-1 flex items-center justify-between gap-2 py-1">
                <button
                  type="button"
                  onClick={deleteRecordingPreview}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Delete Recording"
                >
                  <Trash2 size={18} className="text-red-500" />
                </button>
                
                {recordedAudioUrl && (
                  <div className="flex-1 min-w-0">
                    <AudioPlayer
                      src={recordedAudioUrl}
                      isMine={true}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={sendRecordingPreview}
                  disabled={sending}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </div>
            ) : voiceState === 'sending' ? (
              // Sending Progress UI
              <div className="flex-1 flex items-center justify-center py-2.5 text-xs font-semibold text-primary-600 dark:text-primary-400 gap-2">
                <div className="w-3.5 h-3.5 border-2 border-primary-600/40 border-t-primary-600 rounded-full animate-spin" />
                <span>Sending voice message...</span>
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
