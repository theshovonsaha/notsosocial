export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string
          username: string
          avatar_url: string | null
          is_pro: boolean
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          full_name: string
          username: string
          avatar_url?: string | null
          is_pro?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string
          username?: string
          avatar_url?: string | null
          is_pro?: boolean
        }
      }
      availability: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
      hangout_requests: {
        Row: {
          id: string
          created_at: string
          creator_id: string
          day_of_week: number
          start_time: string
          end_time: string
          status: 'pending' | 'accepted' | 'declined' | 'rescheduled'
          group_chat_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          creator_id: string
          day_of_week: number
          start_time: string
          end_time: string
          status?: 'pending' | 'accepted' | 'declined' | 'rescheduled'
          group_chat_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          creator_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          status?: 'pending' | 'accepted' | 'declined' | 'rescheduled'
          group_chat_id?: string | null
        }
      }
      hangout_participants: {
        Row: {
          id: string
          hangout_id: string
          user_id: string
          status: 'pending' | 'accepted' | 'declined' | 'rescheduled'
          created_at: string
        }
        Insert: {
          id?: string
          hangout_id: string
          user_id: string
          status?: 'pending' | 'accepted' | 'declined' | 'rescheduled'
          created_at?: string
        }
        Update: {
          id?: string
          hangout_id?: string
          user_id?: string
          status?: 'pending' | 'accepted' | 'declined' | 'rescheduled'
          created_at?: string
        }
      }
      group_chats: {
        Row: {
          id: string
          created_at: string
          hangout_id: string
          expires_at: string
          is_permanent: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          hangout_id: string
          expires_at?: string
          is_permanent?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          hangout_id?: string
          expires_at?: string
          is_permanent?: boolean
        }
      }
      chat_participants: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          joined_at: string
          keep_chat: boolean
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          joined_at?: string
          keep_chat?: boolean
        }
        Update: {
          id?: string
          chat_id?: string
          user_id?: string
          joined_at?: string
          keep_chat?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}