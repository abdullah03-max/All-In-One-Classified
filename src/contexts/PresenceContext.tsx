import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface PresenceContextType {
  onlineUserIds: Set<string>;
  isUserOnline: (userId?: string | null, role?: string | null) => boolean;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUserIds: new Set(),
  isUserOnline: () => false,
});

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) {
      setOnlineUserIds(new Set());
      return;
    }

    const channel = supabase.channel('global-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    const updatePresenceState = () => {
      const state = channel.presenceState();
      const onlineIds = new Set<string>();
      Object.keys(state).forEach(id => {
        if (state[id] && state[id].length > 0) {
          onlineIds.add(id);
        }
      });
      setOnlineUserIds(onlineIds);
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        updatePresenceState();
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUserIds(prev => new Set([...prev, key]));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUserIds(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      channel.unsubscribe();
    };
  }, [user?.id]);

  const isUserOnline = useCallback((userId?: string | null, role?: string | null) => {
    if (role === 'admin' || role === 'super_admin' || role === 'moderator') {
      return true; // System / Support accounts are always active
    }
    if (!userId) return false;
    return onlineUserIds.has(userId);
  }, [onlineUserIds]);

  return (
    <PresenceContext.Provider value={{ onlineUserIds, isUserOnline }}>
      {children}
    </PresenceContext.Provider>
  );
};
