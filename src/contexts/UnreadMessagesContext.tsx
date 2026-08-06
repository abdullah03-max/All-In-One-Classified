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

  const markConversationRead = useCallback((conversationId: string) => {
    // Optimistically lower the count — exact value will be corrected on next fetch
    if (!user) return;
    // Re-fetch after a small delay to get the accurate count
    setTimeout(fetchUnreadCount, 300);
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

            // Native Browser Notification
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
                const contentPreview = content.startsWith('[Voice Message]')
                  ? '🎤 Voice message'
                  : (content.startsWith('[Image]') ? '📷 Image' : content.slice(0, 80));

                const notif = new Notification(senderName, {
                  body: contentPreview || 'You received a new message',
                  icon: senderProfile?.avatar_url || undefined,
                  tag: `msg-${payload.new.conversation_id}`,
                });

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
