import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { playNotificationSound } from '../utils/helpers';

interface UnreadMessagesContextType {
  totalUnread: number;
  markConversationRead: (conversationId: string) => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  totalUnread: 0,
  markConversationRead: () => {},
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) { setTotalUnread(0); return; }
    try {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id)
        // Only count messages in conversations this user participates in
        .in(
          'conversation_id',
          (await supabase
            .from('conversations')
            .select('id')
            .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          ).data?.map(c => c.id) ?? []
        );
      setTotalUnread(count ?? 0);
    } catch {
      // silently ignore
    }
  }, [user]);

  const markConversationRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    try {
      await supabase
        .from('messages')
        .update({ is_read: true, is_delivered: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
    } catch {}
    fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user) { setTotalUnread(0); return; }

    // Initial fetch
    fetchUnreadCount();

    // Subscribe to new messages directed at this user
    const channel = supabase
      .channel(`unread-badge:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          if (payload.new.sender_id !== user.id) {
            // Message from someone else → bump badge & ring chime
            setTotalUnread(prev => prev + 1);
            playNotificationSound();

            // Native Mobile & Desktop Web Push Notification
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                const { data: senderProfile } = await supabase
                  .from('users')
                  .select('full_name, avatar_url, role')
                  .eq('id', payload.new.sender_id)
                  .single();

                const isSystem = senderProfile?.role === 'admin' || senderProfile?.role === 'super_admin' || senderProfile?.role === 'moderator';
                const senderName = isSystem ? 'All in One' : (senderProfile?.full_name || 'New Message');

                const content = payload.new.content || '';
                const contentPreview = content.startsWith('[audio]:') || content.startsWith('[Voice Message]')
                  ? '🎤 Voice message'
                  : (content.startsWith('[Image]') ? '📷 Image' : content.slice(0, 80));

                const notifOptions = {
                  body: contentPreview || 'You received a new message',
                  icon: senderProfile?.avatar_url || '/pwa-192x192.png',
                  badge: '/pwa-192x192.png',
                  tag: `msg-${payload.new.conversation_id}`,
                  data: { url: `/chat?conv=${payload.new.conversation_id}` },
                  vibrate: [200, 100, 200],
                };

                // Trigger via Service Worker for Mobile (Android Chrome, Edge, Samsung Internet)
                if ('serviceWorker' in navigator) {
                  try {
                    const reg = await navigator.serviceWorker.ready;
                    if (reg && reg.showNotification) {
                      await reg.showNotification(senderName, notifOptions);
                      return;
                    }
                  } catch {}
                }

                // Fallback for Desktop browsers
                const notif = new Notification(senderName, notifOptions);
                notif.onclick = () => {
                  window.focus();
                  window.location.href = `/chat?conv=${payload.new.conversation_id}`;
                };
              } catch {
                // Silently ignore browser notification errors
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.new.is_read === true && payload.old.is_read === false) {
            fetchUnreadCount();
          }
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user, fetchUnreadCount]);

  return (
    <UnreadMessagesContext.Provider value={{ totalUnread, markConversationRead }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
