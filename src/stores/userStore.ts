import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_pro: boolean;
}

interface UserState {
  users: User[];
  searchResults: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  getUserById: (id: string) => Promise<User | null>;
  getUserByUsername: (username: string) => Promise<User | null>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  searchResults: [],
  loading: false,
  error: null,
  
  fetchUsers: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('username');
      
      if (error) throw error;
      
      set({ users: data || [] });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  searchUsers: async (query) => {
    try {
      set({ loading: true, error: null });
      
      if (!query.trim()) {
        set({ searchResults: [] });
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .order('username')
        .limit(10);
      
      if (error) throw error;
      
      set({ searchResults: data || [] });
    } catch (error: any) {
      console.error('Error searching users:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  getUserById: async (id) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Error fetching user by ID:', error);
      set({ error: error.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  getUserByUsername: async (username) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Error fetching user by username:', error);
      set({ error: error.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));