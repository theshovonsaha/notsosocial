import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface TimeSlot {
  id?: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface AvailabilityState {
  timeSlots: TimeSlot[];
  loading: boolean;
  error: string | null;
  fetchTimeSlots: (userId?: string) => Promise<TimeSlot[]>;
  addTimeSlot: (timeSlot: Omit<TimeSlot, 'id' | 'user_id'>) => Promise<void>;
  updateTimeSlot: (id: string, timeSlot: Partial<TimeSlot>) => Promise<void>;
  deleteTimeSlot: (id: string) => Promise<void>;
  findOverlappingTimeSlots: (userId1: string, userId2: string) => Promise<TimeSlot[]>;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
  timeSlots: [],
  loading: false,
  error: null,
  
  fetchTimeSlots: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      const targetUserId = userId || useAuthStore.getState().user?.id;
      if (!targetUserId) throw new Error('No user ID provided');
      
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', targetUserId)
        .order('day_of_week')
        .order('start_time');
      
      if (error) throw error;
      
      set({ timeSlots: data || [] });
      return data || [];
    } catch (error: any) {
      console.error('Error fetching time slots:', error);
      set({ error: error.message });
      return [];
    } finally {
      set({ loading: false });
    }
  },
  
  addTimeSlot: async (timeSlot) => {
    try {
      set({ loading: true, error: null });
      
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const newTimeSlot = {
        ...timeSlot,
        user_id: userId,
      };
      
      const { error } = await supabase
        .from('availability')
        .insert([newTimeSlot]);
      
      if (error) throw error;
      
      await get().fetchTimeSlots();
    } catch (error: any) {
      console.error('Error adding time slot:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  updateTimeSlot: async (id, timeSlot) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('availability')
        .update(timeSlot)
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchTimeSlots();
    } catch (error: any) {
      console.error('Error updating time slot:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  deleteTimeSlot: async (id) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await get().fetchTimeSlots();
    } catch (error: any) {
      console.error('Error deleting time slot:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  findOverlappingTimeSlots: async (userId1, userId2) => {
    try {
      set({ loading: true, error: null });
      
      // Fetch time slots for both users
      const { data: user1Slots, error: error1 } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', userId1);
      
      if (error1) throw error1;
      
      const { data: user2Slots, error: error2 } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', userId2);
      
      if (error2) throw error2;
      
      // Find overlapping time slots
      const overlappingSlots: TimeSlot[] = [];
      
      if (user1Slots && user2Slots) {
        for (const slot1 of user1Slots) {
          for (const slot2 of user2Slots) {
            if (slot1.day_of_week === slot2.day_of_week) {
              const start1 = new Date(`1970-01-01T${slot1.start_time}`);
              const end1 = new Date(`1970-01-01T${slot1.end_time}`);
              const start2 = new Date(`1970-01-01T${slot2.start_time}`);
              const end2 = new Date(`1970-01-01T${slot2.end_time}`);
              
              // Check if there's an overlap
              if (start1 < end2 && start2 < end1) {
                // Calculate the overlapping time slot
                const overlapStart = start1 > start2 ? slot1.start_time : slot2.start_time;
                const overlapEnd = end1 < end2 ? slot1.end_time : slot2.end_time;
                
                overlappingSlots.push({
                  user_id: userId1, // Using the first user's ID as reference
                  day_of_week: slot1.day_of_week,
                  start_time: overlapStart,
                  end_time: overlapEnd,
                });
              }
            }
          }
        }
      }
      
      return overlappingSlots;
    } catch (error: any) {
      console.error('Error finding overlapping time slots:', error);
      set({ error: error.message });
      return [];
    } finally {
      set({ loading: false });
    }
  },
}));