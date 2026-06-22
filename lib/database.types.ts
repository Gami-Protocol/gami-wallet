export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string;
          id: string;
          idempotency_key: string;
          payload: Json | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          idempotency_key: string;
          payload?: Json | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          payload?: Json | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      nova_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          role: string;
          tools: Json | null;
          user_id: string;
        };
        Insert: {
          content?: string;
          created_at?: string;
          id?: string;
          role: string;
          tools?: Json | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          role?: string;
          tools?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          handle: string | null;
          id: string;
          is_business: boolean;
          level: number;
          persona: string;
          xp: number;
        };
        Insert: {
          created_at?: string;
          handle?: string | null;
          id: string;
          is_business?: boolean;
          level?: number;
          persona?: string;
          xp?: number;
        };
        Update: {
          created_at?: string;
          handle?: string | null;
          id?: string;
          is_business?: boolean;
          level?: number;
          persona?: string;
          xp?: number;
        };
        Relationships: [];
      };
      quest_completions: {
        Row: {
          completed_at: string;
          id: string;
          quest_id: string;
          tx_hash: string | null;
          user_id: string;
          xp_awarded: number;
        };
        Insert: {
          completed_at?: string;
          id?: string;
          quest_id: string;
          tx_hash?: string | null;
          user_id: string;
          xp_awarded?: number;
        };
        Update: {
          completed_at?: string;
          id?: string;
          quest_id?: string;
          tx_hash?: string | null;
          user_id?: string;
          xp_awarded?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'quest_completions_quest_id_fkey';
            columns: ['quest_id'];
            isOneToOne: false;
            referencedRelation: 'quests';
            referencedColumns: ['id'];
          },
        ];
      };
      quests: {
        Row: {
          accent: string;
          action_address: string | null;
          action_chain: string | null;
          action_min_amount: number | null;
          action_type: string;
          active: boolean;
          blurb: string;
          created_at: string;
          creator_id: string | null;
          id: string;
          nova_pick: boolean;
          origin: string;
          scope: string;
          title: string;
          xp: number;
        };
        Insert: {
          accent?: string;
          action_address?: string | null;
          action_chain?: string | null;
          action_min_amount?: number | null;
          action_type?: string;
          active?: boolean;
          blurb?: string;
          created_at?: string;
          creator_id?: string | null;
          id?: string;
          nova_pick?: boolean;
          origin?: string;
          scope?: string;
          title: string;
          xp?: number;
        };
        Update: {
          accent?: string;
          action_address?: string | null;
          action_chain?: string | null;
          action_min_amount?: number | null;
          action_type?: string;
          active?: boolean;
          blurb?: string;
          created_at?: string;
          creator_id?: string | null;
          id?: string;
          nova_pick?: boolean;
          origin?: string;
          scope?: string;
          title?: string;
          xp?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_quest: {
        Args: { p_quest_id: string; p_tx_hash?: string };
        Returns: {
          awarded: number;
          new_level: number;
          new_xp: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
