import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  error: null,
  
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user || null });
      
      if (session?.user) {
        await get().fetchProfile();
      }
      
      // Set up auth state change listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        set({ session, user: session?.user || null });
        
        if (session?.user) {
          await get().fetchProfile();
        } else {
          set({ profile: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ error: 'Failed to initialize authentication' });
    } finally {
      set({ loading: false });
    }
  },
  
  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Login error:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  register: async (email, password, fullName, username) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username,
          },
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Registration error:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  logout: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      set({ session: null, user: null, profile: null });
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchProfile: async () => {
    try {
      const { user } = get();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      set({ profile: data });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      set({ error: error.message });
    }
  },
}));

// Initialize auth on app load
useAuthStore.getState().initialize();