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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_payments: {
        Row: {
          agent_id: string
          commission_amount: number
          created_at: string
          gross_amount: number
          id: string
          net_amount: number
          order_id: string | null
          paid_at: string | null
          status: string
        }
        Insert: {
          agent_id: string
          commission_amount: number
          created_at?: string
          gross_amount: number
          id?: string
          net_amount: number
          order_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Update: {
          agent_id?: string
          commission_amount?: number
          created_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          order_id?: string | null
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_payments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_registrations: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          business_description: string | null
          business_name: string
          created_at: string
          expires_at: string | null
          id: string
          payment_data: Json | null
          payment_id: string | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          registration_fee: number
          status: string
          user_id: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_description?: string | null
          business_name: string
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          registration_fee: number
          status?: string
          user_id: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_description?: string | null
          business_name?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          registration_fee?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_settings: {
        Row: {
          created_at: string
          default_max_events: number
          id: string
          max_events_before_auto_approve: number
          platform_commission_percent: number
          registration_fee: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_max_events?: number
          id?: string
          max_events_before_auto_approve?: number
          platform_commission_percent?: number
          registration_fee?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_max_events?: number
          id?: string
          max_events_before_auto_approve?: number
          platform_commission_percent?: number
          registration_fee?: number
          updated_at?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          business_description: string | null
          business_name: string
          created_at: string
          id: string
          is_auto_approve: boolean
          max_events: number
          registration_payment_id: string | null
          registration_status: string
          successful_events_count: number
          total_commission_paid: number
          total_earnings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_description?: string | null
          business_name: string
          created_at?: string
          id?: string
          is_auto_approve?: boolean
          max_events?: number
          registration_payment_id?: string | null
          registration_status?: string
          successful_events_count?: number
          total_commission_paid?: number
          total_earnings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_description?: string | null
          business_name?: string
          created_at?: string
          id?: string
          is_auto_approve?: boolean
          max_events?: number
          registration_payment_id?: string | null
          registration_status?: string
          successful_events_count?: number
          total_commission_paid?: number
          total_earnings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      concerts: {
        Row: {
          agent_id: string | null
          artist: string
          category: string
          city: string
          created_at: string
          date: string
          description: string | null
          event_status: Database["public"]["Enums"]["event_status"]
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          platform_commission_percent: number | null
          rejection_reason: string | null
          time: string
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          agent_id?: string | null
          artist: string
          category?: string
          city: string
          created_at?: string
          date: string
          description?: string | null
          event_status?: Database["public"]["Enums"]["event_status"]
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          platform_commission_percent?: number | null
          rejection_reason?: string | null
          time: string
          title: string
          updated_at?: string
          venue: string
        }
        Update: {
          agent_id?: string | null
          artist?: string
          category?: string
          city?: string
          created_at?: string
          date?: string
          description?: string | null
          event_status?: Database["public"]["Enums"]["event_status"]
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          platform_commission_percent?: number | null
          rejection_reason?: string | null
          time?: string
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "concerts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          concert_id: string | null
          created_at: string
          id: string
          is_used: boolean | null
          order_id: string
          quantity: number
          subtotal: number
          ticket_code: string | null
          ticket_type_id: string | null
          unit_price: number
          used_at: string | null
          validated_by: string | null
        }
        Insert: {
          concert_id?: string | null
          created_at?: string
          id?: string
          is_used?: boolean | null
          order_id: string
          quantity?: number
          subtotal: number
          ticket_code?: string | null
          ticket_type_id?: string | null
          unit_price: number
          used_at?: string | null
          validated_by?: string | null
        }
        Update: {
          concert_id?: string | null
          created_at?: string
          id?: string
          is_used?: boolean | null
          order_id?: string
          quantity?: number
          subtotal?: number
          ticket_code?: string | null
          ticket_type_id?: string | null
          unit_price?: number
          used_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          expires_at: string | null
          id: string
          order_number: string
          payment_data: Json | null
          payment_id: string | null
          payment_method: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          order_number: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          expires_at?: string | null
          id?: string
          order_number?: string
          payment_data?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          status_message: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          status_message?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          status_message?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          available_quantity: number
          benefits: string[] | null
          concert_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          total_quantity: number
        }
        Insert: {
          available_quantity?: number
          benefits?: string[] | null
          concert_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          total_quantity?: number
        }
        Update: {
          available_quantity?: number
          benefits?: string[] | null
          concert_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          total_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_concert_id_fkey"
            columns: ["concert_id"]
            isOneToOne: false
            referencedRelation: "concerts"
            referencedColumns: ["id"]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      withdrawals: {
        Row: {
          admin_notes: string | null
          agent_id: string
          amount: number
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          created_at: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          agent_id: string
          amount: number
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          agent_id?: string
          amount?: number
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_agent: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "agent"
      event_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "cancelled"
      user_status: "active" | "suspended" | "inactive"
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
      app_role: ["admin", "user", "agent"],
      event_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "cancelled",
      ],
      user_status: ["active", "suspended", "inactive"],
    },
  },
} as const
