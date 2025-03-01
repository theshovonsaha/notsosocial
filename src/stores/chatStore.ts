import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface Message {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    username: string;
    full_name: string;
  };
}

interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  joined_at: string;
  keep_chat: boolean;
  user?: {
    username: string;
    full_name: string;
    is_pro: boolean;
  };
}

interface Chat {
  id: string;
  created_at: string;
  hangout_id: string;
  expires_at: string;
  is_permanent: boolean;
  participants?: ChatParticipant[];
  messages?: Message[];
  timeRemaining?: number; // in milliseconds
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  fetchChats: () => Promise<void>;
  fetchChatById: (id: string) => Promise<Chat | null>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  toggleKeepChat: (chatId: string, keepChat: boolean) => Promise<void>;
  addParticipant: (chatId: string, userId: string) => Promise<void>;
  subscribeToMessages: (chatId: string) => () => void;
  calculateTimeRemaining: (expiresAt: string) => number;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  loading: false,
  error: null,
  
  fetchChats: async () => {
    try {
      set({ loading: true, error: null });
      
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          chat:group_chats(*)
        `)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const chats = data.map(item => ({
        ...item.chat,
        timeRemaining: get().calculateTimeRemaining(item.chat.expires_at),
      }));
      
      set({ chats });
    } catch (error: any) {
      console.error('Error fetching chats:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchChatById: async (id) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('group_chats')
        .select(`
          *,
          participants:chat_participants(
            *,
            user:users(username, full_name, is_pro)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const chat = {
        ...data,
        timeRemaining: get().calculateTimeRemaining(data.expires_at),
      };
      
      set({ currentChat: chat });
      await get().fetchMessages(id);
      
      return chat;
    } catch (error: any) {
      console.error('Error fetching chat:', error);
      set({ error: error.message, currentChat: null });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  fetchMessages: async (chatId) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users(username, full_name)
        `)
        .eq('chat_id', chatId)
        .order('created_at');
      
      if (error) throw error;
      
      set({ messages: data || [] });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  sendMessage: async (chatId, content) => {
    try {
      set({ loading: true, error: null });
      
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          user_id: userId,
          content,
        }]);
      
      if (error) throw error;
      
      // No need to fetch messages as the subscription will handle it
    } catch (error: any) {
      console.error('Error sending message:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  toggleKeepChat: async (chatId, keepChat) => {
    try {
      set({ loading: true, error: null });
      
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      // Check if user is pro
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_pro')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      if (!userData.is_pro && keepChat) {
        throw new Error('Only Pro users can keep chats');
      }
      
      const { error } = await supabase
        .from('chat_participants')
        .update({ keep_chat: keepChat })
        .eq('chat_id', chatId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      await get().fetchChatById(chatId);
    } catch (error: any) {
      console.error('Error toggling keep chat:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  addParticipant: async (chatId, userId) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('chat_participants')
        .insert([{
          chat_id: chatId,
          user_id: userId,
        }]);
      
      if (error) throw error;
      
      await get().fetchChatById(chatId);
    } catch (error: any) {
      console.error('Error adding participant:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  subscribeToMessages: (chatId) => {
    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      }, async (payload) => {
        // Fetch the new message with user details
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            user:users(username, full_name)
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (!error && data) {
          set(state => ({
            messages: [...state.messages, data],
          }));
        }
      })
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  },
  
  calculateTimeRemaining: (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return Math.max(0, expiry.getTime() - now.getTime());
  },
}));