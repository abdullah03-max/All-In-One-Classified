import { supabase } from '../lib/supabase';
import { Conversation, Message } from '../types';

export const chatService = {
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(id, title, images, price, currency, status),
        buyer:users!conversations_buyer_id_fkey(id, full_name, avatar_url, role),
        seller:users!conversations_seller_id_fkey(id, full_name, avatar_url, role),
        messages(id, content, created_at, is_read, sender_id)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    if (error) throw error;

    return (data as unknown as (Conversation & { messages: Message[] })[]).map(conv => ({
      ...conv,
      last_message: conv.messages?.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0],
      unread_count: conv.messages?.filter(m => !m.is_read && m.sender_id !== userId).length || 0,
    }));
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`*, sender:users!messages_sender_id_fkey(id, full_name, avatar_url, role)`)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as unknown as Message[];
  },

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select(`*, sender:users!messages_sender_id_fkey(id, full_name, avatar_url, role)`)
      .single();
    if (error) throw error;
    return data as unknown as Message;
  },

  async getOrCreateConversation(
    listingId: string,
    buyerId: string,
    sellerId: string
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('get_or_create_conversation', {
        p_listing_id: listingId,
        p_buyer_id: buyerId,
        p_seller_id: sellerId,
      });
    if (error) throw error;
    return data as string;
  },

  async markMessagesRead(conversationId: string, userId: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
  },

  async deleteMessageForMe(messageId: string, userId: string): Promise<void> {
    // 1. Instantly persist locally for smooth offline/instant UI
    try {
      localStorage.setItem(`deleted_msg_${userId}_${messageId}`, 'true');
    } catch {}

    // 2. Try DB update for persistent cross-device syncing
    try {
      const { data: existing } = await supabase
        .from('messages')
        .select('deleted_for_users')
        .eq('id', messageId)
        .single();
      
      const currentList: string[] = existing?.deleted_for_users || [];
      if (!currentList.includes(userId)) {
        await supabase
          .from('messages')
          .update({ deleted_for_users: [...currentList, userId] })
          .eq('id', messageId);
      }
    } catch {
      // Fallback silently if DB column is restricted
    }
  },

  async deleteMessageForEveryone(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        content: 'This message was deleted.'
      })
      .eq('id', messageId);
    
    if (error) throw error;
  },

  /**
   * Subscribe to new or updated messages in a conversation.
   * Returns the RealtimeChannel so the caller can unsubscribe.
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (msg: Message) => void,
    onUpdateMessage?: (msg: Message) => void
  ) {
    const channel = supabase
      .channel(`messages:conv:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch full message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`*, sender:users!messages_sender_id_fkey(id, full_name, avatar_url, role)`)
            .eq('id', payload.new.id)
            .single();
          if (data) onMessage(data as unknown as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(`*, sender:users!messages_sender_id_fkey(id, full_name, avatar_url, role)`)
            .eq('id', payload.new.id)
            .single();
          if (data && onUpdateMessage) onUpdateMessage(data as unknown as Message);
        }
      )
      .subscribe();
    return channel;
  },

  /**
   * Subscribe to conversation-level changes for a user.
   */
  subscribeToConversations(
    userId: string,
    onUpdate: () => void
  ) {
    const channel = supabase
      .channel(`conversations:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();
    return channel;
  },
};
