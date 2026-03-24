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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          comment: string | null
          conversation_id: string | null
          created_at: string
          id: string
          message_index: number
          rating: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_index: number
          rating: string
          user_id: string
        }
        Update: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_index?: number
          rating?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_system_config: {
        Row: {
          config_key: string
          config_value: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_training_data: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          data_type: string | null
          description: string | null
          embedding: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_active: boolean | null
          processed: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          data_type?: string | null
          description?: string | null
          embedding?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          processed?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          data_type?: string | null
          description?: string | null
          embedding?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          processed?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          model: string
          response_time_ms: number | null
          tokens_input: number | null
          tokens_output: number | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          model: string
          response_time_ms?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          model?: string
          response_time_ms?: number | null
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          link_key: string
          location: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          link_key: string
          location: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          link_key?: string
          location?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          badge_label: string | null
          badge_link: string | null
          body: string | null
          created_at: string
          cta_label: string | null
          cta_link: string | null
          extra: Json
          id: string
          is_active: boolean
          section_key: string
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          badge_label?: string | null
          badge_link?: string | null
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          section_key: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          badge_label?: string | null
          badge_link?: string | null
          body?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          section_key?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          setting_key: string
          sort_order: number
          updated_at: string
          value_json: Json | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          setting_key: string
          sort_order?: number
          updated_at?: string
          value_json?: Json | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          setting_key?: string
          sort_order?: number
          updated_at?: string
          value_json?: Json | null
          value_text?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          gradient_class: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          quote: string
          role: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          gradient_class?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          quote: string
          role: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          gradient_class?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          quote?: string
          role?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_content_items: {
        Row: {
          category: string
          content_type: string
          created_at: string
          created_by: string | null
          duration: string | null
          file_url: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          category: string
          content_type: string
          created_at?: string
          created_by?: string | null
          duration?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          duration?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      business_appointments: {
        Row: {
          appointment_at: string
          client_name: string
          created_at: string
          duration_minutes: number
          id: string
          price: number
          service_id: string | null
          service_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_at: string
          client_name: string
          created_at?: string
          duration_minutes?: number
          id?: string
          price?: number
          service_id?: string | null
          service_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_at?: string
          client_name?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          price?: number
          service_id?: string | null
          service_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "business_services"
            referencedColumns: ["id"]
          },
        ]
      }
      business_services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_metrics: {
        Row: {
          active_clients: number
          bookings_count: number
          business_health_score: number | null
          client_user_id: string
          conversion_rate: number
          created_at: string
          id: string
          metric_date: string
          retention_new: number
          retention_returning: number
          revenue: number
          service_distribution: Json
          services_count: number
          sessions_count: number | null
          top_services: Json
          training_progress: Json
          updated_at: string
        }
        Insert: {
          active_clients?: number
          bookings_count?: number
          business_health_score?: number | null
          client_user_id: string
          conversion_rate?: number
          created_at?: string
          id?: string
          metric_date?: string
          retention_new?: number
          retention_returning?: number
          revenue?: number
          service_distribution?: Json
          services_count?: number
          sessions_count?: number | null
          top_services?: Json
          training_progress?: Json
          updated_at?: string
        }
        Update: {
          active_clients?: number
          bookings_count?: number
          business_health_score?: number | null
          client_user_id?: string
          conversion_rate?: number
          created_at?: string
          id?: string
          metric_date?: string
          retention_new?: number
          retention_returning?: number
          revenue?: number
          service_distribution?: Json
          services_count?: number
          sessions_count?: number | null
          top_services?: Json
          training_progress?: Json
          updated_at?: string
        }
        Relationships: []
      }
      client_notes: {
        Row: {
          category: string
          client_user_id: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          id: string
          note_date: string
          note_text: string
          updated_at: string
        }
        Insert: {
          category?: string
          client_user_id: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          note_date?: string
          note_text: string
          updated_at?: string
        }
        Update: {
          category?: string
          client_user_id?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          note_date?: string
          note_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_archived: boolean
          name: string
          price: number
          quantity: number
          supplier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          price?: number
          quantity?: number
          supplier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          price?: number
          quantity?: number
          supplier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      forum_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reply_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reply_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          media_url: string
          post_id: string
          sort_order: number | null
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: string
          media_url: string
          post_id: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          post_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          created_at: string
          id: string
          is_approved: boolean | null
          is_pinned: boolean | null
          likes_count: number | null
          replies_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          replies_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_pinned?: boolean | null
          likes_count?: number | null
          replies_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_approved: boolean | null
          likes_count: number | null
          post_id: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          post_id?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string | null
          status: string | null
        }
        Insert: {
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          status?: string | null
        }
        Update: {
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          applications_count: number | null
          company_name: string
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          job_type: string | null
          location: string | null
          posted_by: string
          required_skills: string[] | null
          salary_range: string | null
          title: string
          updated_at: string
        }
        Insert: {
          applications_count?: number | null
          company_name: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          job_type?: string | null
          location?: string | null
          posted_by: string
          required_skills?: string[] | null
          salary_range?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          applications_count?: number | null
          company_name?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          job_type?: string | null
          location?: string | null
          posted_by?: string
          required_skills?: string[] | null
          salary_range?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_posted_by_fk"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mailing_list: {
        Row: {
          access_token: string | null
          created_at: string
          email: string
          id: string
          name: string
          source: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          source?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          source?: string | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          mailing_list_id: string | null
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          mailing_list_id?: string | null
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mailing_list_id?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscriptions_mailing_list_id_fkey"
            columns: ["mailing_list_id"]
            isOneToOne: false
            referencedRelation: "mailing_list"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          related_post_id: string | null
          related_reply_id: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          related_post_id?: string | null
          related_reply_id?: string | null
          related_user_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          related_post_id?: string | null
          related_reply_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          city: string | null
          created_at: string
          cv_file_url: string | null
          display_name: string
          experience_level: string | null
          experience_years: number | null
          growth_plan: string | null
          id: string
          instagram_url: string | null
          is_public: boolean | null
          linkedin_url: string | null
          location: string | null
          onboarding_completed: boolean | null
          phone_number: string | null
          preferred_learning_format: string | null
          primary_goal: string | null
          skills: string[] | null
          team_size: string | null
          time_availability: string | null
          updated_at: string
          user_id: string
          user_type: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          cv_file_url?: string | null
          display_name: string
          experience_level?: string | null
          experience_years?: number | null
          growth_plan?: string | null
          id?: string
          instagram_url?: string | null
          is_public?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          preferred_learning_format?: string | null
          primary_goal?: string | null
          skills?: string[] | null
          team_size?: string | null
          time_availability?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          cv_file_url?: string | null
          display_name?: string
          experience_level?: string | null
          experience_years?: number | null
          growth_plan?: string | null
          id?: string
          instagram_url?: string | null
          is_public?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          onboarding_completed?: boolean | null
          phone_number?: string | null
          preferred_learning_format?: string | null
          primary_goal?: string | null
          skills?: string[] | null
          team_size?: string | null
          time_availability?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          id: string
          ip_address: unknown
          resource: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown
          resource: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown
          resource?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_videos: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          is_active: boolean
          source_type: string
          thumbnail_url: string | null
          updated_at: string
          video_type: string
          youtube_url: string | null
          youtube_video_id: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          is_active?: boolean
          source_type?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_type: string
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          is_active?: boolean
          source_type?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_type?: string
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
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
      search_training_data: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          data_type: string
          description: string
          id: string
          similarity: number
          title: string
        }[]
      }
      validate_access_token: {
        Args: { token_to_validate: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "collaborator" | "user"
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
      app_role: ["admin", "collaborator", "user"],
    },
  },
} as const
