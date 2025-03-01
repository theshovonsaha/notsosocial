import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

interface Hangout {
  id: string;
  created_at: string;
  creator_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'accepted' | 'declined' | 'rescheduled';
  group_chat_id: string | null;
  participants?: HangoutParticipant[];
  creator?: {
    username: string;
    full_name: string;
  };
}

interface HangoutParticipant {
  id: string;
  hangout_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'rescheduled';
  created_at: string;
  user?: {
    username: string;
    full_name: string;
  };
}

interface HangoutState {
  hangouts: Hangout[];
  currentHangout: Hangout | null;
  loading: boolean;
  error: string | null;
  fetchHangouts: () => Promise<void>;
  fetchHangoutById: (id: string) => Promise<Hangout | null>;
  createHangout: (hangout: Partial<Hangout>, participantIds: string[]) => Promise<string | null>;
  updateHangoutStatus: (id: string, status: Hangout['status']) => Promise<void>;
  updateParticipantStatus: (hangoutId: string, userId: string, status: HangoutParticipant['status']) => Promise<void>;
  addParticipant: (hangoutId: string, userId: string) => Promise<void>;
  removeParticipant: (hangoutId: string, userId: string) => Promise<void>;
}

export const useHangoutStore = create<HangoutState>((set, get) => ({
  hangouts: [],
  currentHangout: null,
  loading: false,
  error: null,
  
  fetchHangouts: async () => {
    try {
      set({ loading: true, error: null });
      
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      // Fetch hangouts created by the user
      const { data: createdHangouts, error: createdError } = await supabase
        .from('hangout_requests')
        .select(`
          *,
          participants:hangout_participants(
            *,
            user:users(username, full_name)
          )
        `)
        .eq('creator_id', userId);
      
      if (createdError) throw createdError;
      
      // Fetch hangouts where the user is a participant
      const { data: participatingHangouts, error: participatingError } = await supabase
        .from('hangout_participants')
        .select(`
          *,
          hangout:hangout_requests(
            *,
            creator:users(username, full_name),
            participants:hangout_participants(
              *,
              user:users(username, full_name)
            )
          )
        `)
        .eq('user_id', userId);
      
      if (participatingError) throw participatingError;
      
      // Combine and format the results
      const formattedParticipatingHangouts = participatingHangouts
        .map(item => ({
          ...item.hangout,
          participants: item.hangout.participants,
          creator: item.hangout.creator
        }));
      
      const allHangouts = [
        ...(createdHangouts || []),
        ...(formattedParticipatingHangouts || [])
      ];
      
      // Remove duplicates
      const uniqueHangouts = Array.from(
        new Map(allHangouts.map(item => [item.id, item])).values()
      );
      
      set({ hangouts: uniqueHangouts });
    } catch (error: any) {
      console.error('Error fetching hangouts:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchHangoutById: async (id) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('hangout_requests')
        .select(`
          *,
          creator:users(username, full_name),
          participants:hangout_participants(
            *,
            user:users(username, full_name)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({ currentHangout: data });
      return data;
    } catch (error: any) {
      console.error('Error fetching hangout:', error);
      set({ error: error.message, currentHangout: null });
      return null;
    } finally {
      set({ loading: false });
    }
  },
  
  createHangout: async (hangout, participantIds) => {
  try {
    set({ loading: true, error: null });
    
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');
    
    // Create the hangout request
    const { data: hangoutData, error: hangoutError } = await supabase
      .from('hangout_requests')
      .insert([{
        ...hangout,
        creator_id: userId,
      }])
      .select()
      .single();
    
    if (hangoutError) throw hangoutError;
    
    // Add participants, ensuring no duplicates (including the creator)
    // First create a Set to ensure unique user IDs
    const uniqueParticipantIds = new Set(participantIds);
    
    // If the creator is already in the participants list, we don't need to handle them specially
    
    // Convert the Set back to an array and map to participant objects
    const participants = Array.from(uniqueParticipantIds).map(participantId => ({
      hangout_id: hangoutData.id,
      user_id: participantId,
      status: 'pending',
    }));
    
    // Only insert participants if there are any
    if (participants.length > 0) {
      const { error: participantsError } = await supabase
        .from('hangout_participants')
        .insert(participants);
      
      if (participantsError) throw participantsError;
    }
    
    await get().fetchHangouts();
    return hangoutData.id;
  } catch (error: any) {
    console.error('Error creating hangout:', error);
    set({ error: error.message });
    return null;
  } finally {
    set({ loading: false });
  }
},
  
  updateHangoutStatus: async (id, status) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('hangout_requests')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      // If status is 'accepted', create a group chat
      if (status === 'accepted') {
        const hangout = await get().fetchHangoutById(id);
        
        if (hangout) {
          // Check if all participants have accepted
          const allAccepted = hangout.participants?.every(p => p.status === 'accepted');
          
          if (allAccepted) {
            // Create a group chat
            const { data: chatData, error: chatError } = await supabase
              .from('group_chats')
              .insert([{
                hangout_id: id,
                expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              }])
              .select()
              .single();
            
            if (chatError) throw chatError;
            
            // Update the hangout with the chat ID
            const { error: updateError } = await supabase
              .from('hangout_requests')
              .update({ group_chat_id: chatData.id })
              .eq('id', id);
            
            if (updateError) throw updateError;
            
            // Add all participants to the chat
            const chatParticipants = hangout.participants?.map(p => ({
              chat_id: chatData.id,
              user_id: p.user_id,
            })) || [];
            
            // Add the creator if not already included
            if (!chatParticipants.some(p => p.user_id === hangout.creator_id)) {
              chatParticipants.push({
                chat_id: chatData.id,
                user_id: hangout.creator_id,
              });
            }
            
            const { error: participantsError } = await supabase
              .from('chat_participants')
              .insert(chatParticipants);
            
            if (participantsError) throw participantsError;
          }
        }
      }
      
      await get().fetchHangouts();
    } catch (error: any) {
      console.error('Error updating hangout status:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  updateParticipantStatus: async (hangoutId, userId, status) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('hangout_participants')
        .update({ status })
        .eq('hangout_id', hangoutId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // If all participants have accepted, update the hangout status
      if (status === 'accepted') {
        const hangout = await get().fetchHangoutById(hangoutId);
        
        if (hangout) {
          const allAccepted = hangout.participants?.every(p => p.status === 'accepted');
          
          if (allAccepted) {
            await get().updateHangoutStatus(hangoutId, 'accepted');
          }
        }
      }
      
      await get().fetchHangouts();
    } catch (error: any) {
      console.error('Error updating participant status:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  addParticipant: async (hangoutId, userId) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('hangout_participants')
        .insert([{
          hangout_id: hangoutId,
          user_id: userId,
          status: 'pending',
        }]);
      
      if (error) throw error;
      
      await get().fetchHangoutById(hangoutId);
    } catch (error: any) {
      console.error('Error adding participant:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  
  removeParticipant: async (hangoutId, userId) => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase
        .from('hangout_participants')
        .delete()
        .eq('hangout_id', hangoutId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      await get().fetchHangoutById(hangoutId);
    } catch (error: any) {
      console.error('Error removing participant:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));