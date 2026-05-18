export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      items: {
        Row: {
          id: string
          name: string
          category: string | null
          brand: string | null
          serial_number: string | null
          location: string
          officer: string | null
          condition: string
          status: string
          qr_link: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          brand?: string | null
          serial_number?: string | null
          location: string
          officer?: string | null
          condition?: string
          status?: string
          qr_link?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['items']['Insert']>
      }
      locations: {
        Row: {
          id: number
          code: string
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['locations']['Insert']>
      }
      officers: {
        Row: {
          id: number
          name: string
          position: string | null
          unit: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          position?: string | null
          unit?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['officers']['Insert']>
      }
      activity_logs: {
        Row: {
          id: number
          item_id: string
          item_name: string
          location: string
          condition: string | null
          officer: string | null
          action: string
          notes: string | null
          type: string
          created_at: string
        }
        Insert: {
          id?: number
          item_id: string
          item_name: string
          location: string
          condition?: string | null
          officer?: string | null
          action: string
          notes?: string | null
          type: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>
      }
      system_profiles: {
        Row: {
          id: number
          institution_name: string
          address: string | null
          active_officer: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          institution_name?: string
          address?: string | null
          active_officer?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['system_profiles']['Insert']>
      }
    }
  }
}
