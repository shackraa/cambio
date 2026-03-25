export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          code: string;
          status: 'waiting' | 'playing' | 'finished';
          created_at: string;
          host_id: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          status?: 'waiting' | 'playing' | 'finished';
          created_at?: string;
          host_id?: string | null;
        };
        Update: {
          status?: 'waiting' | 'playing' | 'finished';
          host_id?: string | null;
        };
      };
      players: {
        Row: {
          id: string;
          room_id: string;
          nickname: string;
          seat: number;
          score: number;
          is_online: boolean;
          is_ready: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          nickname: string;
          seat: number;
          score?: number;
          is_online?: boolean;
          is_ready?: boolean;
          joined_at?: string;
        };
        Update: {
          score?: number;
          is_online?: boolean;
          is_ready?: boolean;
        };
      };
      game_state: {
        Row: {
          id: string;
          room_id: string;
          deck: Json;
          discard_pile: Json;
          current_turn: number;
          drawn_card: Json | null;
          phase: string;
          cambio_caller: number | null;
          remaining_turns: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          deck: Json;
          discard_pile?: Json;
          current_turn?: number;
          drawn_card?: Json | null;
          phase?: string;
          cambio_caller?: number | null;
          remaining_turns?: number;
          updated_at?: string;
        };
        Update: {
          deck?: Json;
          discard_pile?: Json;
          current_turn?: number;
          drawn_card?: Json | null;
          phase?: string;
          cambio_caller?: number | null;
          remaining_turns?: number;
          updated_at?: string;
        };
      };
      player_cards: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          position: number;
          card_value: number;
          card_suit: string;
          card_rank: string;
          is_revealed: boolean;
          is_penalty: boolean;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          position: number;
          card_value: number;
          card_suit: string;
          card_rank: string;
          is_revealed?: boolean;
          is_penalty?: boolean;
        };
        Update: {
          card_value?: number;
          card_suit?: string;
          card_rank?: string;
          is_revealed?: boolean;
          is_penalty?: boolean;
        };
      };
    };
  };
}
