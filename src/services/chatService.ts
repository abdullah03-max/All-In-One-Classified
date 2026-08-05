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

  /**
   * Subscribe to new messages in a conversation.
   * Returns the RealtimeChannel so the caller can unsubscribe.
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (msg: Message) => void
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
      .subscribe();
    return channel;
  },

  /**
   * Subscribe to conversation-level changes for a user.
   * Fires whenever any conversation the user is in gets a new message
   * (via the updated_at trigger on conversations table).
   */
  subscribeToConversations(
    userId: string,
    onUpdate: () => void
  ) {
    // Subscribe to messages INSERT events — whenever any message is inserted
    // in any conversation this user participates in, re-fetch conversations
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
      .subscribe();
    return channel;
  },
};
