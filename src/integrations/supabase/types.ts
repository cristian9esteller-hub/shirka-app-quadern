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
      attendance: {
        Row: {
          afternoon_status: string
          class_id: string
          created_at: string
          date: string
          id: string
          morning_status: string
          student_id: string
          user_id: string
        }
        Insert: {
          afternoon_status?: string
          class_id: string
          created_at?: string
          date: string
          id?: string
          morning_status?: string
          student_id: string
          user_id: string
        }
        Update: {
          afternoon_status?: string
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          morning_status?: string
          student_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          color: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          recurring: Json | null
          subject: string | null
          time: string | null
          title: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          recurring?: Json | null
          subject?: string | null
          time?: string | null
          title: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          recurring?: Json | null
          subject?: string | null
          time?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          annual_objectives: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          quarterly_objectives: Json | null
          room: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_objectives?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          quarterly_objectives?: Json | null
          room?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_objectives?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          quarterly_objectives?: Json | null
          room?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      evaluation_activities: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          name: string
          subject: string
          term: string
          user_id: string
          weight: number
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          name: string
          subject: string
          term: string
          user_id: string
          weight?: number
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          name?: string
          subject?: string
          term?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_activities_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_grades: {
        Row: {
          activity_id: string
          created_at: string
          grade: number | null
          id: string
          student_id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          grade?: number | null
          id?: string
          student_id: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          grade?: number | null
          id?: string
          student_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_grades_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "evaluation_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          agreements: string | null
          completed: boolean
          created_at: string
          date: string
          discussion: string | null
          id: string
          location: string | null
          recurring: Json | null
          student_id: string | null
          time: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          agreements?: string | null
          completed?: boolean
          created_at?: string
          date: string
          discussion?: string | null
          id?: string
          location?: string | null
          recurring?: Json | null
          student_id?: string | null
          time?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          agreements?: string | null
          completed?: boolean
          created_at?: string
          date?: string
          discussion?: string | null
          id?: string
          location?: string | null
          recurring?: Json | null
          student_id?: string | null
          time?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          gender: string | null
          id: string
          name: string
          role: string
          subjects: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          name?: string
          role?: string
          subjects?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          name?: string
          role?: string
          subjects?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          alerts: Json | null
          avatar_url: string | null
          behavior_log: Json | null
          class_id: string
          created_at: string
          id: string
          name: string
          personal_data: Json | null
          private_notes: string | null
          tutors: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts?: Json | null
          avatar_url?: string | null
          behavior_log?: Json | null
          class_id: string
          created_at?: string
          id?: string
          name: string
          personal_data?: Json | null
          private_notes?: string | null
          tutors?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts?: Json | null
          avatar_url?: string | null
          behavior_log?: Json | null
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          personal_data?: Json | null
          private_notes?: string | null
          tutors?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          tags: Json | null
          text: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          tags?: Json | null
          text: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          tags?: Json | null
          text?: string
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
