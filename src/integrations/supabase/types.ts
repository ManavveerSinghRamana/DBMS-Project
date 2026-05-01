export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affected_areas: {
        Row: {
          area_id: string
          area_name: string
          created_at: string
          disaster_id: string
          latitude: number | null
          longitude: number | null
          population: number
          severity: string
        }
        Insert: {
          area_id?: string
          area_name: string
          created_at?: string
          disaster_id: string
          latitude?: number | null
          longitude?: number | null
          population?: number
          severity?: string
        }
        Update: {
          area_id?: string
          area_name?: string
          created_at?: string
          disaster_id?: string
          latitude?: number | null
          longitude?: number | null
          population?: number
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "affected_areas_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "disasters"
            referencedColumns: ["disaster_id"]
          },
          {
            foreignKeyName: "affected_areas_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "v_disaster_overview"
            referencedColumns: ["disaster_id"]
          },
        ]
      }
      disasters: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          disaster_id: string
          disaster_name: string
          disaster_type: string
          end_date: string | null
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          disaster_id?: string
          disaster_name: string
          disaster_type: string
          end_date?: string | null
          start_date?: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          disaster_id?: string
          disaster_name?: string
          disaster_type?: string
          end_date?: string | null
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      distribution: {
        Row: {
          admin_id: string | null
          area_id: string
          distribution_date: string
          distribution_id: string
          material_name: string
          notes: string | null
          quantity: number
        }
        Insert: {
          admin_id?: string | null
          area_id: string
          distribution_date?: string
          distribution_id?: string
          material_name: string
          notes?: string | null
          quantity: number
        }
        Update: {
          admin_id?: string | null
          area_id?: string
          distribution_date?: string
          distribution_id?: string
          material_name?: string
          notes?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "distribution_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "affected_areas"
            referencedColumns: ["area_id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          disaster_id: string | null
          donation_date: string
          donation_id: string
          message: string | null
          user_id: string
        }
        Insert: {
          amount: number
          disaster_id?: string | null
          donation_date?: string
          donation_id?: string
          message?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          disaster_id?: string | null
          donation_date?: string
          donation_id?: string
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "disasters"
            referencedColumns: ["disaster_id"]
          },
          {
            foreignKeyName: "donations_disaster_id_fkey"
            columns: ["disaster_id"]
            isOneToOne: false
            referencedRelation: "v_disaster_overview"
            referencedColumns: ["disaster_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          user_email: string
          user_name: string
          user_phoneno: string | null
        }
        Insert: {
          created_at?: string
          id: string
          user_email: string
          user_name: string
          user_phoneno?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          user_email?: string
          user_name?: string
          user_phoneno?: string | null
        }
        Relationships: []
      }
      shelter_movements: {
        Row: {
          count: number
          movement_id: string
          movement_type: string
          recorded_at: string
          recorded_by: string | null
          shelter_id: string
        }
        Insert: {
          count: number
          movement_id?: string
          movement_type: string
          recorded_at?: string
          recorded_by?: string | null
          shelter_id: string
        }
        Update: {
          count?: number
          movement_id?: string
          movement_type?: string
          recorded_at?: string
          recorded_by?: string | null
          shelter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelter_movements_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["shelter_id"]
          },
        ]
      }
      shelters: {
        Row: {
          area_id: string
          capacity: number
          contact_number: string | null
          created_at: string
          latitude: number | null
          location: string
          longitude: number | null
          occupied_count: number
          shelter_id: string
          shelter_name: string
        }
        Insert: {
          area_id: string
          capacity: number
          contact_number?: string | null
          created_at?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          occupied_count?: number
          shelter_id?: string
          shelter_name: string
        }
        Update: {
          area_id?: string
          capacity?: number
          contact_number?: string | null
          created_at?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          occupied_count?: number
          shelter_id?: string
          shelter_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelters_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "affected_areas"
            referencedColumns: ["area_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_disaster_overview: {
        Row: {
          affected_area_count: number | null
          disaster_id: string | null
          disaster_name: string | null
          disaster_type: string | null
          shelter_count: number | null
          start_date: string | null
          status: string | null
          total_affected_population: number | null
          total_capacity: number | null
          total_occupied: number | null
        }
        Relationships: []
      }
      v_donation_summary: {
        Row: {
          day: string | null
          donation_count: number | null
          total_amount: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_disaster: {
        Args: {
          p_description: string
          p_name: string
          p_start_date: string
          p_type: string
        }
        Returns: string
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_donation: {
        Args: { p_amount: number; p_disaster_id: string; p_message: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "government" | "donor" | "public_user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "government", "donor", "public_user"],
    },
  },
} as const
