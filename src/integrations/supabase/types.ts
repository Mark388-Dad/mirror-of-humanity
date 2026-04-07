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
      access_codes: {
        Row: {
          class_name: string | null
          code: string
          code_type: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          house: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          role_restriction: string | null
          school_name: string | null
          year_group: string | null
        }
        Insert: {
          class_name?: string | null
          code: string
          code_type: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          house?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          role_restriction?: string | null
          school_name?: string | null
          year_group?: string | null
        }
        Update: {
          class_name?: string | null
          code?: string
          code_type?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          house?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          role_restriction?: string | null
          school_name?: string | null
          year_group?: string | null
        }
        Relationships: []
      }
      book_reviews: {
        Row: {
          book_submission_id: string
          created_at: string
          id: string
          rating: number
          review_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_submission_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_submission_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_reviews_book_submission_id_fkey"
            columns: ["book_submission_id"]
            isOneToOne: false
            referencedRelation: "book_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      book_submissions: {
        Row: {
          ai_feedback: string | null
          approval_status: string | null
          author: string
          category_name: string
          category_number: number
          created_at: string
          date_finished: string
          date_started: string
          id: string
          points_earned: number
          reflection: string
          reviewed_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          approval_status?: string | null
          author: string
          category_name: string
          category_number: number
          created_at?: string
          date_finished: string
          date_started: string
          id?: string
          points_earned?: number
          reflection: string
          reviewed_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          approval_status?: string | null
          author?: string
          category_name?: string
          category_number?: number
          created_at?: string
          date_finished?: string
          date_started?: string
          id?: string
          points_earned?: number
          reflection?: string
          reviewed_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          background_image_url: string | null
          body_text: string
          created_at: string
          id: string
          is_published: boolean
          level: string
          school_logo_url: string | null
          subtitle: string
          template_preset: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          background_image_url?: string | null
          body_text?: string
          created_at?: string
          id?: string
          is_published?: boolean
          level: string
          school_logo_url?: string | null
          subtitle?: string
          template_preset?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          background_image_url?: string | null
          body_text?: string
          created_at?: string
          id?: string
          is_published?: boolean
          level?: string
          school_logo_url?: string | null
          subtitle?: string
          template_preset?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          books_completed: number | null
          challenge_id: string
          completed_at: string | null
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          books_completed?: number | null
          challenge_id: string
          completed_at?: string | null
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          books_completed?: number | null
          challenge_id?: string
          completed_at?: string | null
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_submissions: {
        Row: {
          author: string
          category_name: string
          category_number: number
          challenge_id: string
          created_at: string
          id: string
          points_earned: number
          reflection: string
          title: string
          user_id: string
        }
        Insert: {
          author?: string
          category_name?: string
          category_number?: number
          challenge_id: string
          created_at?: string
          id?: string
          points_earned?: number
          reflection?: string
          title: string
          user_id: string
        }
        Update: {
          author?: string
          category_name?: string
          category_number?: number
          challenge_id?: string
          created_at?: string
          id?: string
          points_earned?: number
          reflection?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          accent_color: string | null
          allowed_classes: string[] | null
          allowed_houses: string[] | null
          allowed_year_groups: string[] | null
          badge_icon: string | null
          badge_name: string | null
          category: string | null
          challenge_type: string
          cover_image_url: string | null
          created_at: string
          created_by: string
          custom_css: string | null
          description: string
          difficulty_level: string | null
          end_date: string
          evidence_type: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_independent: boolean
          layout_config: Json | null
          leaderboard_type: string | null
          logo_url: string | null
          participation_type: string | null
          points_reward: number | null
          primary_color: string | null
          requires_submission: boolean | null
          secondary_color: string | null
          start_date: string
          target_books: number | null
          target_categories: number[] | null
          title: string
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          accent_color?: string | null
          allowed_classes?: string[] | null
          allowed_houses?: string[] | null
          allowed_year_groups?: string[] | null
          badge_icon?: string | null
          badge_name?: string | null
          category?: string | null
          challenge_type: string
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          custom_css?: string | null
          description: string
          difficulty_level?: string | null
          end_date: string
          evidence_type?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_independent?: boolean
          layout_config?: Json | null
          leaderboard_type?: string | null
          logo_url?: string | null
          participation_type?: string | null
          points_reward?: number | null
          primary_color?: string | null
          requires_submission?: boolean | null
          secondary_color?: string | null
          start_date: string
          target_books?: number | null
          target_categories?: number[] | null
          title: string
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          accent_color?: string | null
          allowed_classes?: string[] | null
          allowed_houses?: string[] | null
          allowed_year_groups?: string[] | null
          badge_icon?: string | null
          badge_name?: string | null
          category?: string | null
          challenge_type?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          custom_css?: string | null
          description?: string
          difficulty_level?: string | null
          end_date?: string
          evidence_type?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_independent?: boolean
          layout_config?: Json | null
          leaderboard_type?: string | null
          logo_url?: string | null
          participation_type?: string | null
          points_reward?: number | null
          primary_color?: string | null
          requires_submission?: boolean | null
          secondary_color?: string | null
          start_date?: string
          target_books?: number | null
          target_categories?: number[] | null
          title?: string
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      custom_categories: {
        Row: {
          created_at: string
          created_by: string
          id: number
          is_active: boolean
          name: string
          prompt: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: number
          is_active?: boolean
          name: string
          prompt?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          is_active?: boolean
          name?: string
          prompt?: string
        }
        Relationships: []
      }
      homepage_content: {
        Row: {
          content: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_visible: boolean | null
          section_key: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          section_key: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_visible?: boolean | null
          section_key?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      librarian_files: {
        Row: {
          ai_extracted_text: string | null
          ai_summary: string | null
          category: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_public: boolean | null
          uploaded_by: string
        }
        Insert: {
          ai_extracted_text?: string | null
          ai_summary?: string | null
          category?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_public?: boolean | null
          uploaded_by: string
        }
        Update: {
          ai_extracted_text?: string | null
          ai_summary?: string | null
          category?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_public?: boolean | null
          uploaded_by?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          email_sent: boolean | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_submissions: {
        Row: {
          author: string
          category_name: string
          category_number: number
          class_name: string | null
          created_at: string
          date_finished: string
          date_started: string
          email: string
          house: string | null
          id: string
          imported_at: string | null
          imported_to_user_id: string | null
          reflection: string
          student_name: string
          title: string
          year_group: string | null
        }
        Insert: {
          author: string
          category_name: string
          category_number: number
          class_name?: string | null
          created_at?: string
          date_finished: string
          date_started: string
          email: string
          house?: string | null
          id?: string
          imported_at?: string | null
          imported_to_user_id?: string | null
          reflection: string
          student_name: string
          title: string
          year_group?: string | null
        }
        Update: {
          author?: string
          category_name?: string
          category_number?: number
          class_name?: string | null
          created_at?: string
          date_finished?: string
          date_started?: string
          email?: string
          house?: string | null
          id?: string
          imported_at?: string | null
          imported_to_user_id?: string | null
          reflection?: string
          student_name?: string
          title?: string
          year_group?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          class_name: string | null
          created_at: string
          email: string
          full_name: string
          house: Database["public"]["Enums"]["house_name"] | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          year_group: Database["public"]["Enums"]["year_group"] | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string
          email: string
          full_name: string
          house?: Database["public"]["Enums"]["house_name"] | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          year_group?: Database["public"]["Enums"]["year_group"] | null
        }
        Update: {
          class_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          house?: Database["public"]["Enums"]["house_name"] | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          year_group?: Database["public"]["Enums"]["year_group"] | null
        }
        Relationships: []
      }
      reading_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_submission_date: string | null
          longest_streak: number
          total_bonus_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_submission_date?: string | null
          longest_streak?: number
          total_bonus_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_submission_date?: string | null
          longest_streak?: number
          total_bonus_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sheet_sync_logs: {
        Row: {
          created_at: string
          errors: string[] | null
          id: string
          records_synced: number | null
          sync_type: string
          synced_by: string | null
        }
        Insert: {
          created_at?: string
          errors?: string[] | null
          id?: string
          records_synced?: number | null
          sync_type: string
          synced_by?: string | null
        }
        Update: {
          created_at?: string
          errors?: string[] | null
          id?: string
          records_synced?: number | null
          sync_type?: string
          synced_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      house_leaderboard: {
        Row: {
          house: Database["public"]["Enums"]["house_name"] | null
          total_books: number | null
          total_points: number | null
          total_readers: number | null
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          achievement_level:
            | Database["public"]["Enums"]["achievement_level"]
            | null
          books_read: number | null
          class_name: string | null
          full_name: string | null
          house: Database["public"]["Enums"]["house_name"] | null
          total_points: number | null
          user_id: string | null
          year_group: Database["public"]["Enums"]["year_group"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      achievement_level: "none" | "bronze" | "silver" | "gold"
      house_name: "Kenya" | "Longonot" | "Kilimanjaro" | "Elgon"
      user_role:
        | "student"
        | "homeroom_tutor"
        | "head_of_year"
        | "house_patron"
        | "librarian"
        | "staff"
      year_group: "MYP5" | "DP1" | "DP2" | "G10" | "G11" | "G12"
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
      achievement_level: ["none", "bronze", "silver", "gold"],
      house_name: ["Kenya", "Longonot", "Kilimanjaro", "Elgon"],
      user_role: [
        "student",
        "homeroom_tutor",
        "head_of_year",
        "house_patron",
        "librarian",
        "staff",
      ],
      year_group: ["MYP5", "DP1", "DP2", "G10", "G11", "G12"],
    },
  },
} as const
