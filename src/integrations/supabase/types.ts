export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
          notes: string | null;
          party_size: number | null;
          phone: string | null;
          slot_end: string | null;
          slot_start: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          notes?: string | null;
          party_size?: number | null;
          phone?: string | null;
          slot_end?: string | null;
          slot_start: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          party_size?: number | null;
          phone?: string | null;
          slot_end?: string | null;
          slot_start?: string;
          status?: string;
        };
        Relationships: [];
      };
      artists: {
        Row: {
          bio: string | null;
          birth_year: number | null;
          created_at: string;
          featured: boolean;
          id: string;
          mediums: string[] | null;
          movements: string[] | null;
          name: string;
          nationality_origin: string | null;
          portrait_image_url: string | null;
          practice_statement: string | null;
          slug: string;
          social_links: Json | null;
        };
        Insert: {
          bio?: string | null;
          birth_year?: number | null;
          created_at?: string;
          featured?: boolean;
          id?: string;
          mediums?: string[] | null;
          movements?: string[] | null;
          name: string;
          nationality_origin?: string | null;
          portrait_image_url?: string | null;
          practice_statement?: string | null;
          slug: string;
          social_links?: Json | null;
        };
        Update: {
          bio?: string | null;
          birth_year?: number | null;
          created_at?: string;
          featured?: boolean;
          id?: string;
          mediums?: string[] | null;
          movements?: string[] | null;
          name?: string;
          nationality_origin?: string | null;
          portrait_image_url?: string | null;
          practice_statement?: string | null;
          slug?: string;
          social_links?: Json | null;
        };
        Relationships: [];
      };
      artworks: {
        Row: {
          artist_id?: string | null;
          authenticity_notes: string | null;
          availability: Database["public"]["Enums"]["availability"];
          created_at: string;
          dimensions: string | null;
          display_price: number | null;
          price?: number | null;
          stock_quantity?: number | null;
          category?: string | null;
          metadata?: Json | null;
          featured: boolean;
          gallery_image_urls: string[] | null;
          id: string;
          medium: string | null;
          movement_tags: string[] | null;
          origin_country: string | null;
          price_display: Database["public"]["Enums"]["price_display"];
          price_max: number | null;
          price_min: number | null;
          primary_image_url: string | null;
          slug: string;
          story: string | null;
          title: string;
          year_created: number | null;
        };
        Insert: {
          artist_id?: string | null;
          authenticity_notes?: string | null;
          availability?: Database["public"]["Enums"]["availability"];
          created_at?: string;
          dimensions?: string | null;
          display_price?: number | null;
          price?: number | null;
          stock_quantity?: number | null;
          category?: string | null;
          metadata?: Json | null;
          featured?: boolean;
          gallery_image_urls?: string[] | null;
          id?: string;
          medium?: string | null;
          movement_tags?: string[] | null;
          origin_country?: string | null;
          price_display?: Database["public"]["Enums"]["price_display"];
          price_max?: number | null;
          price_min?: number | null;
          primary_image_url?: string | null;
          slug: string;
          story?: string | null;
          title: string;
          year_created?: number | null;
        };
        Update: {
          artist_id?: string | null;
          authenticity_notes?: string | null;
          availability?: Database["public"]["Enums"]["availability"];
          created_at?: string;
          dimensions?: string | null;
          display_price?: number | null;
          price?: number | null;
          stock_quantity?: number | null;
          category?: string | null;
          metadata?: Json | null;
          featured?: boolean;
          gallery_image_urls?: string[] | null;
          id?: string;
          medium?: string | null;
          movement_tags?: string[] | null;
          origin_country?: string | null;
          price_display?: Database["public"]["Enums"]["price_display"];
          price_max?: number | null;
          price_min?: number | null;
          primary_image_url?: string | null;
          slug?: string;
          story?: string | null;
          title?: string;
          year_created?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "artworks_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      cart_items: {
        Row: {
          artwork_id: string;
          created_at: string;
          id: string;
          reserved_at: string | null;
          user_id: string;
          quantity: number;
        };
        Insert: {
          artwork_id: string;
          created_at?: string;
          id?: string;
          reserved_at?: string | null;
          user_id: string;
          quantity?: number;
        };
        Update: {
          artwork_id?: string;
          created_at?: string;
          id?: string;
          reserved_at?: string | null;
          user_id?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_artwork_id_fkey";
            columns: ["artwork_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id"];
          },
        ];
      };
      commissioned_samples: {
        Row: {
          artist_name: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          title: string;
          year_completed: number | null;
        };
        Insert: {
          artist_name?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          title: string;
          year_completed?: number | null;
        };
        Update: {
          artist_name?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          title?: string;
          year_completed?: number | null;
        };
        Relationships: [];
      };
      exhibitions: {
        Row: {
          catalogue_url: string | null;
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          end_date: string | null;
          featured: boolean;
          id: string;
          slug: string;
          start_date: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          catalogue_url?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          featured?: boolean;
          id?: string;
          slug: string;
          start_date?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          catalogue_url?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          featured?: boolean;
          id?: string;
          slug?: string;
          start_date?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          artwork_id: string | null;
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          phone: string | null;
          source_page: string | null;
          status: Database["public"]["Enums"]["inquiry_status"];
          type: string;
        };
        Insert: {
          artwork_id?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
          source_page?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          type?: string;
        };
        Update: {
          artwork_id?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
          source_page?: string | null;
          status?: Database["public"]["Enums"]["inquiry_status"];
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inquiries_artwork_id_fkey";
            columns: ["artwork_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_entries: {
        Row: {
          body: string | null;
          cover_image_url: string | null;
          created_at: string;
          id: string;
          published_at: string;
          related_artist_ids: string[] | null;
          related_artwork_ids: string[] | null;
          slug: string;
          title: string;
          type: Database["public"]["Enums"]["journal_type"];
        };
        Insert: {
          body?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          published_at?: string;
          related_artist_ids?: string[] | null;
          related_artwork_ids?: string[] | null;
          slug: string;
          title: string;
          type: Database["public"]["Enums"]["journal_type"];
        };
        Update: {
          body?: string | null;
          cover_image_url?: string | null;
          created_at?: string;
          id?: string;
          published_at?: string;
          related_artist_ids?: string[] | null;
          related_artwork_ids?: string[] | null;
          slug?: string;
          title?: string;
          type?: Database["public"]["Enums"]["journal_type"];
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          cancel_reason: string | null;
          cancelled_at: string | null;
          carrier_name: string | null;
          created_at: string;
          currency: string;
          estimated_delivery: string | null;
          id: string;
          items: Json;
          notes: string | null;
          shipping_address: Json | string | null;
          shipping_city: string | null;
          shipping_cost: number | null;
          shipping_country: string | null;
          shipping_email: string | null;
          shipping_name: string | null;
          shipping_postal: string | null;
          status: string;
          subtotal: number | null;
          tax_cost: number | null;
          total: number | null;
          total_amount?: number | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          payment_status?: string | null;
          payment_method?: string | null;
          fulfillment_status?: string | null;
          tracking_number: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          carrier_name?: string | null;
          created_at?: string;
          currency?: string;
          estimated_delivery?: string | null;
          id?: string;
          items?: Json;
          notes?: string | null;
          shipping_address?: Json | string | null;
          shipping_city?: string | null;
          shipping_cost?: number | null;
          shipping_country?: string | null;
          shipping_email?: string | null;
          shipping_name?: string | null;
          shipping_postal?: string | null;
          status?: string;
          subtotal?: number | null;
          tax_cost?: number | null;
          total?: number | null;
          total_amount?: number | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          payment_status?: string | null;
          payment_method?: string | null;
          fulfillment_status?: string | null;
          tracking_number?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          carrier_name?: string | null;
          created_at?: string;
          currency?: string;
          estimated_delivery?: string | null;
          id?: string;
          items?: Json;
          notes?: string | null;
          shipping_address?: Json | string | null;
          shipping_city?: string | null;
          shipping_cost?: number | null;
          shipping_country?: string | null;
          shipping_email?: string | null;
          shipping_name?: string | null;
          shipping_postal?: string | null;
          status?: string;
          subtotal?: number | null;
          tax_cost?: number | null;
          total?: number | null;
          total_amount?: number | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          payment_status?: string | null;
          payment_method?: string | null;
          fulfillment_status?: string | null;
          tracking_number?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      press_mentions: {
        Row: {
          created_at: string;
          excerpt: string | null;
          external_url: string | null;
          featured: boolean;
          id: string;
          logo_url: string | null;
          publication: string;
          published_at: string | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          excerpt?: string | null;
          external_url?: string | null;
          featured?: boolean;
          id?: string;
          logo_url?: string | null;
          publication: string;
          published_at?: string | null;
          title: string;
        };
        Update: {
          created_at?: string;
          excerpt?: string | null;
          external_url?: string | null;
          featured?: boolean;
          id?: string;
          logo_url?: string | null;
          publication?: string;
          published_at?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          is_admin: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          is_admin?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_admin?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          artwork_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          artwork_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          artwork_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_artwork_id_fkey";
            columns: ["artwork_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          key: string;
          value: unknown;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: unknown;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: unknown;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_reservations: {
        Row: {
          id: string;
          artwork_id: string;
          order_id: string | null;
          status: "active" | "converted" | "released" | "expired";
          reserved_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          artwork_id: string;
          order_id?: string | null;
          status?: "active" | "converted" | "released" | "expired";
          reserved_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          artwork_id?: string;
          order_id?: string | null;
          status?: "active" | "converted" | "released" | "expired";
          reserved_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_reservations_artwork_id_fkey";
            columns: ["artwork_id"];
            isOneToOne: false;
            referencedRelation: "artworks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_reservations_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      acquisition_cases: {
        Row: {
          id: string;
          order_id: string;
          assigned_admin: string | null;
          stage:
            | "new"
            | "contacted"
            | "negotiating"
            | "kyc_pending"
            | "payment_pending"
            | "payment_received"
            | "closed_lost";
          agreed_amount: number | null;
          payment_method: string | null;
          payment_reference: string | null;
          notes: string | null;
          hold_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          assigned_admin?: string | null;
          stage?:
            | "new"
            | "contacted"
            | "negotiating"
            | "kyc_pending"
            | "payment_pending"
            | "payment_received"
            | "closed_lost";
          agreed_amount?: number | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          notes?: string | null;
          hold_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          assigned_admin?: string | null;
          stage?:
            | "new"
            | "contacted"
            | "negotiating"
            | "kyc_pending"
            | "payment_pending"
            | "payment_received"
            | "closed_lost";
          agreed_amount?: number | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          notes?: string | null;
          hold_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "acquisition_cases_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_roles: {
        Row: {
          user_id: string;
          role: "super_admin" | "order_manager" | "inventory_manager" | "support";
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: "super_admin" | "order_manager" | "inventory_manager" | "support";
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: "super_admin" | "order_manager" | "inventory_manager" | "support";
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_type: "user" | "admin" | "system" | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_value: unknown;
          new_value: unknown;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_type?: "user" | "admin" | "system" | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_value?: unknown;
          new_value?: unknown;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          actor_type?: "user" | "admin" | "system" | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_value?: unknown;
          new_value?: unknown;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cancel_own_order: {
        Args: {
          p_order_id: string;
          p_reason?: string | null;
        };
        Returns: void;
      };
      update_artworks_availability: {
        Args: {
          p_artwork_ids: string[];
          p_availability: string;
        };
        Returns: void;
      };
      reserve_artwork: {
        Args: {
          p_artwork_id: string;
          p_order_id: string;
          p_ttl_minutes?: number;
        };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      availability: "available" | "reserved" | "sold" | "not_for_sale";
      inquiry_status: "new" | "contacted" | "closed";
      journal_type: "exhibition" | "press" | "interview" | "guide";
      price_display: "range" | "on_request" | "fixed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      availability: ["available", "reserved", "sold", "not_for_sale"],
      inquiry_status: ["new", "contacted", "closed"],
      journal_type: ["exhibition", "press", "interview", "guide"],
      price_display: ["range", "on_request", "fixed"],
    },
  },
} as const;
