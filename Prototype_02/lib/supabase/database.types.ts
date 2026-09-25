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
      access_audit: {
        Row: {
          action: string
          actor_id: string | null
          at: string
          detail: string
          facility_id: string
          id: string
          target: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          at?: string
          detail?: string
          facility_id: string
          id?: string
          target?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          at?: string
          detail?: string
          facility_id?: string
          id?: string
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_audit_facility_id_actor_id_fkey"
            columns: ["facility_id", "actor_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "access_audit_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_reads: {
        Row: {
          alert_id: string
          facility_id: string
          read_at: string
          staff_id: string
        }
        Insert: {
          alert_id: string
          facility_id: string
          read_at?: string
          staff_id: string
        }
        Update: {
          alert_id?: string
          facility_id?: string
          read_at?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_reads_facility_id_alert_id_fkey"
            columns: ["facility_id", "alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "alert_reads_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_reads_facility_id_staff_id_fkey"
            columns: ["facility_id", "staff_id"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
        ]
      }
      alerts: {
        Row: {
          body: string
          created_at: string
          facility_id: string
          href: string
          id: string
          title: string
          to_emails: string[]
          to_roles: Database["public"]["Enums"]["staff_role"][]
        }
        Insert: {
          body?: string
          created_at?: string
          facility_id: string
          href?: string
          id?: string
          title: string
          to_emails?: string[]
          to_roles?: Database["public"]["Enums"]["staff_role"][]
        }
        Update: {
          body?: string
          created_at?: string
          facility_id?: string
          href?: string
          id?: string
          title?: string
          to_emails?: string[]
          to_roles?: Database["public"]["Enums"]["staff_role"][]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          facility_id: string
          id: string
          name: string
        }
        Insert: {
          facility_id: string
          id?: string
          name: string
        }
        Update: {
          facility_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      clean_checklist_items: {
        Row: {
          facility_id: string
          id: string
          kind: Database["public"]["Enums"]["clean_kind"]
          label: string
          position: number
        }
        Insert: {
          facility_id: string
          id?: string
          kind: Database["public"]["Enums"]["clean_kind"]
          label: string
          position?: number
        }
        Update: {
          facility_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["clean_kind"]
          label?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "clean_checklist_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      clean_job_checks: {
        Row: {
          checked_at: string
          clean_job_id: string
          facility_id: string
          item_id: string
        }
        Insert: {
          checked_at?: string
          clean_job_id: string
          facility_id: string
          item_id: string
        }
        Update: {
          checked_at?: string
          clean_job_id?: string
          facility_id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clean_job_checks_facility_id_clean_job_id_fkey"
            columns: ["facility_id", "clean_job_id"]
            isOneToOne: false
            referencedRelation: "clean_jobs"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "clean_job_checks_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clean_job_checks_facility_id_item_id_fkey"
            columns: ["facility_id", "item_id"]
            isOneToOne: false
            referencedRelation: "clean_checklist_items"
            referencedColumns: ["facility_id", "id"]
          },
        ]
      }
      clean_jobs: {
        Row: {
          assigned_to: string | null
          created_at: string
          due_on: string
          facility_id: string
          finished_at: string | null
          id: string
          kind: Database["public"]["Enums"]["clean_kind"]
          room_number: string
          started_at: string | null
          status: Database["public"]["Enums"]["cleaning_status"]
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          due_on?: string
          facility_id: string
          finished_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["clean_kind"]
          room_number: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["cleaning_status"]
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          due_on?: string
          facility_id?: string
          finished_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["clean_kind"]
          room_number?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["cleaning_status"]
        }
        Relationships: [
          {
            foreignKeyName: "clean_jobs_facility_id_assigned_to_fkey"
            columns: ["facility_id", "assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "clean_jobs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clean_jobs_facility_id_room_number_fkey"
            columns: ["facility_id", "room_number"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["facility_id", "number"]
          },
        ]
      }
      clean_notes: {
        Row: {
          body: string
          clean_job_id: string
          created_at: string
          created_by: string | null
          facility_id: string
          id: string
        }
        Insert: {
          body: string
          clean_job_id: string
          created_at?: string
          created_by?: string | null
          facility_id: string
          id?: string
        }
        Update: {
          body?: string
          clean_job_id?: string
          created_at?: string
          created_by?: string | null
          facility_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clean_notes_facility_id_clean_job_id_fkey"
            columns: ["facility_id", "clean_job_id"]
            isOneToOne: false
            referencedRelation: "clean_jobs"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "clean_notes_facility_id_created_by_fkey"
            columns: ["facility_id", "created_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "clean_notes_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendance: {
        Row: {
          event_id: string
          facility_id: string
          marked_at: string
          room_number: string
        }
        Insert: {
          event_id: string
          facility_id: string
          marked_at?: string
          room_number: string
        }
        Update: {
          event_id?: string
          facility_id?: string
          marked_at?: string
          room_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_facility_id_event_id_fkey"
            columns: ["facility_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "event_attendance_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_facility_id_room_number_fkey"
            columns: ["facility_id", "room_number"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["facility_id", "number"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          attendance_at: string | null
          building_id: string | null
          facility_id: string
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          place: string
          room_number: string | null
          starts_at: string
          title: string
        }
        Insert: {
          all_day?: boolean
          attendance_at?: string | null
          building_id?: string | null
          facility_id: string
          id?: string
          kind: Database["public"]["Enums"]["event_kind"]
          place?: string
          room_number?: string | null
          starts_at: string
          title: string
        }
        Update: {
          all_day?: boolean
          attendance_at?: string | null
          building_id?: string | null
          facility_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          place?: string
          room_number?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_facility_id_building_id_fkey"
            columns: ["facility_id", "building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "events_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_facility_id_room_number_fkey"
            columns: ["facility_id", "room_number"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["facility_id", "number"]
          },
        ]
      }
      facilities: {
        Row: {
          created_at: string
          deep_clean_minutes: number
          id: string
          name: string
          routine_clean_minutes: number
        }
        Insert: {
          created_at?: string
          deep_clean_minutes?: number
          id?: string
          name: string
          routine_clean_minutes?: number
        }
        Update: {
          created_at?: string
          deep_clean_minutes?: number
          id?: string
          name?: string
          routine_clean_minutes?: number
        }
        Relationships: []
      }
      fridge_temp_logs: {
        Row: {
          facility_id: string
          fridge_id: string
          id: string
          recorded_at: string
          recorded_by: string | null
          temp_f: number
        }
        Insert: {
          facility_id: string
          fridge_id: string
          id?: string
          recorded_at?: string
          recorded_by?: string | null
          temp_f: number
        }
        Update: {
          facility_id?: string
          fridge_id?: string
          id?: string
          recorded_at?: string
          recorded_by?: string | null
          temp_f?: number
        }
        Relationships: [
          {
            foreignKeyName: "fridge_temp_logs_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fridge_temp_logs_facility_id_fridge_id_fkey"
            columns: ["facility_id", "fridge_id"]
            isOneToOne: false
            referencedRelation: "fridges"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "fridge_temp_logs_facility_id_recorded_by_fkey"
            columns: ["facility_id", "recorded_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
        ]
      }
      fridges: {
        Row: {
          facility_id: string
          id: string
          label: string
        }
        Insert: {
          facility_id: string
          id?: string
          label: string
        }
        Update: {
          facility_id?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "fridges_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_checklist_completions: {
        Row: {
          completed_at: string
          completed_by: string | null
          facility_id: string
          id: string
          item_id: string
          on_date: string
        }
        Insert: {
          completed_at?: string
          completed_by?: string | null
          facility_id: string
          id?: string
          item_id: string
          on_date?: string
        }
        Update: {
          completed_at?: string
          completed_by?: string | null
          facility_id?: string
          id?: string
          item_id?: string
          on_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_checklist_completions_facility_id_completed_by_fkey"
            columns: ["facility_id", "completed_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "kitchen_checklist_completions_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_checklist_completions_facility_id_item_id_fkey"
            columns: ["facility_id", "item_id"]
            isOneToOne: false
            referencedRelation: "kitchen_checklist_items"
            referencedColumns: ["facility_id", "id"]
          },
        ]
      }
      kitchen_checklist_items: {
        Row: {
          facility_id: string
          id: string
          label: string
          position: number
        }
        Insert: {
          facility_id: string
          id?: string
          label: string
          position?: number
        }
        Update: {
          facility_id?: string
          id?: string
          label?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_checklist_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_photos: {
        Row: {
          facility_id: string
          id: string
          position: number
          request_id: string
          storage_path: string
        }
        Insert: {
          facility_id: string
          id?: string
          position: number
          request_id: string
          storage_path: string
        }
        Update: {
          facility_id?: string
          id?: string
          position?: number
          request_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_photos_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_photos_facility_id_request_id_fkey"
            columns: ["facility_id", "request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["facility_id", "id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          area: string
          assigned_at: string | null
          assigned_to: string | null
          clean_job_id: string | null
          created_at: string
          created_by: string | null
          details: string
          facility_id: string
          fixed_at: string | null
          id: string
          priority: Database["public"]["Enums"]["maintenance_priority"]
          room_number: string | null
          seen_at: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          title: string
        }
        Insert: {
          area?: string
          assigned_at?: string | null
          assigned_to?: string | null
          clean_job_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string
          facility_id: string
          fixed_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          room_number?: string | null
          seen_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title: string
        }
        Update: {
          area?: string
          assigned_at?: string | null
          assigned_to?: string | null
          clean_job_id?: string | null
          created_at?: string
          created_by?: string | null
          details?: string
          facility_id?: string
          fixed_at?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          room_number?: string | null
          seen_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_facility_id_assigned_to_fkey"
            columns: ["facility_id", "assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "maintenance_requests_facility_id_clean_job_id_fkey"
            columns: ["facility_id", "clean_job_id"]
            isOneToOne: false
            referencedRelation: "clean_jobs"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "maintenance_requests_facility_id_created_by_fkey"
            columns: ["facility_id", "created_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "maintenance_requests_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_facility_id_room_number_fkey"
            columns: ["facility_id", "room_number"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["facility_id", "number"]
          },
        ]
      }
      maintenance_updates: {
        Row: {
          created_at: string
          created_by: string | null
          facility_id: string
          id: string
          note: string
          request_id: string
          status: Database["public"]["Enums"]["maintenance_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          facility_id: string
          id?: string
          note?: string
          request_id: string
          status: Database["public"]["Enums"]["maintenance_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          facility_id?: string
          id?: string
          note?: string
          request_id?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_updates_facility_id_created_by_fkey"
            columns: ["facility_id", "created_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "maintenance_updates_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_updates_facility_id_request_id_fkey"
            columns: ["facility_id", "request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["facility_id", "id"]
          },
        ]
      }
      meal_feedback: {
        Row: {
          created_at: string
          facility_id: string
          id: string
          meal: Database["public"]["Enums"]["meal"]
          menu_item_id: string
          thumbs: Database["public"]["Enums"]["thumbs"]
        }
        Insert: {
          created_at?: string
          facility_id: string
          id?: string
          meal: Database["public"]["Enums"]["meal"]
          menu_item_id: string
          thumbs: Database["public"]["Enums"]["thumbs"]
        }
        Update: {
          created_at?: string
          facility_id?: string
          id?: string
          meal?: Database["public"]["Enums"]["meal"]
          menu_item_id?: string
          thumbs?: Database["public"]["Enums"]["thumbs"]
        }
        Relationships: [
          {
            foreignKeyName: "meal_feedback_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_feedback_facility_id_menu_item_id_fkey"
            columns: ["facility_id", "menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["facility_id", "id"]
          },
        ]
      }
      meal_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          facility_id: string
          id: string
          meal: Database["public"]["Enums"]["meal"]
          menu_item_id: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          placed_by: string | null
          ready_at: string | null
          room_number: string
          special: string
          started_at: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          facility_id: string
          id?: string
          meal: Database["public"]["Enums"]["meal"]
          menu_item_id?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          placed_by?: string | null
          ready_at?: string | null
          room_number: string
          special?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          facility_id?: string
          id?: string
          meal?: Database["public"]["Enums"]["meal"]
          menu_item_id?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          placed_by?: string | null
          ready_at?: string | null
          room_number?: string
          special?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "meal_orders_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_orders_facility_id_menu_item_id_fkey"
            columns: ["facility_id", "menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "meal_orders_facility_id_placed_by_fkey"
            columns: ["facility_id", "placed_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "meal_orders_facility_id_room_number_fkey"
            columns: ["facility_id", "room_number"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["facility_id", "number"]
          },
        ]
      }
      menu_files: {
        Row: {
          facility_id: string
          file_kind: string
          file_name: string
          id: string
          meal: Database["public"]["Enums"]["meal"]
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          facility_id: string
          file_kind: string
          file_name: string
          id?: string
          meal: Database["public"]["Enums"]["meal"]
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          facility_id?: string
          file_kind?: string
          file_name?: string
          id?: string
          meal?: Database["public"]["Enums"]["meal"]
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_files_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_files_facility_id_uploaded_by_fkey"
            columns: ["facility_id", "uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
        ]
      }
      menu_items: {
        Row: {
          active: boolean
          facility_id: string
          id: string
          meal: Database["public"]["Enums"]["meal"]
          name: string
        }
        Insert: {
          active?: boolean
          facility_id: string
          id?: string
          meal: Database["public"]["Enums"]["meal"]
          name: string
        }
        Update: {
          active?: boolean
          facility_id?: string
          id?: string
          meal?: Database["public"]["Enums"]["meal"]
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      role_access: {
        Row: {
          facility_id: string
          module: Database["public"]["Enums"]["module_id"]
          role: Database["public"]["Enums"]["staff_role"]
        }
        Insert: {
          facility_id: string
          module: Database["public"]["Enums"]["module_id"]
          role: Database["public"]["Enums"]["staff_role"]
        }
        Update: {
          facility_id?: string
          module?: Database["public"]["Enums"]["module_id"]
          role?: Database["public"]["Enums"]["staff_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_access_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      room_feedback: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          department: Database["public"]["Enums"]["department"]
          facility_id: string
          id: string
          kind: Database["public"]["Enums"]["feedback_kind"]
          room_number: string
          topic: Database["public"]["Enums"]["feedback_topic"]
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          department: Database["public"]["Enums"]["department"]
          facility_id: string
          id?: string
          kind: Database["public"]["Enums"]["feedback_kind"]
          room_number: string
          topic: Database["public"]["Enums"]["feedback_topic"]
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          department?: Database["public"]["Enums"]["department"]
          facility_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["feedback_kind"]
          room_number?: string
          topic?: Database["public"]["Enums"]["feedback_topic"]
        }
        Relationships: [
          {
            foreignKeyName: "room_feedback_facility_id_created_by_fkey"
            columns: ["facility_id", "created_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "room_feedback_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_feedback_facility_id_room_number_fkey"
            columns: ["facility_id", "room_number"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["facility_id", "number"]
          },
        ]
      }
      rooms: {
        Row: {
          assigned_to: string | null
          building_id: string | null
          clean_days: number[]
          facility_id: string
          id: string
          number: string
          occupancy: Database["public"]["Enums"]["occupancy"]
        }
        Insert: {
          assigned_to?: string | null
          building_id?: string | null
          clean_days?: number[]
          facility_id: string
          id?: string
          number: string
          occupancy?: Database["public"]["Enums"]["occupancy"]
        }
        Update: {
          assigned_to?: string | null
          building_id?: string | null
          clean_days?: number[]
          facility_id?: string
          id?: string
          number?: string
          occupancy?: Database["public"]["Enums"]["occupancy"]
        }
        Relationships: [
          {
            foreignKeyName: "rooms_facility_id_assigned_to_fkey"
            columns: ["facility_id", "assigned_to"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "rooms_facility_id_building_id_fkey"
            columns: ["facility_id", "building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "rooms_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_accounts: {
        Row: {
          created_at: string
          email: string | null
          facility_id: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["staff_role"] | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          facility_id: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["staff_role"] | null
        }
        Update: {
          created_at?: string
          email?: string | null
          facility_id?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["staff_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_accounts_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      staffing_days: {
        Row: {
          department: Database["public"]["Enums"]["department"]
          facility_id: string
          needed: number
          on_date: string
          scheduled: number
        }
        Insert: {
          department: Database["public"]["Enums"]["department"]
          facility_id: string
          needed: number
          on_date: string
          scheduled: number
        }
        Update: {
          department?: Database["public"]["Enums"]["department"]
          facility_id?: string
          needed?: number
          on_date?: string
          scheduled?: number
        }
        Relationships: [
          {
            foreignKeyName: "staffing_days_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      stays: {
        Row: {
          checked_in_at: string
          checked_out_at: string | null
          ends_on: string
          facility_id: string
          id: string
          room_number: string
          starts_on: string
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          ends_on: string
          facility_id: string
          id?: string
          room_number: string
          starts_on: string
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          ends_on?: string
          facility_id?: string
          id?: string
          room_number?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "stays_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_facility_id_room_number_fkey"
            columns: ["facility_id", "room_number"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["facility_id", "number"]
          },
        ]
      }
      supplies: {
        Row: {
          count: number
          facility_id: string
          id: string
          label: string
        }
        Insert: {
          count?: number
          facility_id: string
          id?: string
          label: string
        }
        Update: {
          count?: number
          facility_id?: string
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplies_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          created_at: string
          created_by: string | null
          done_at: string | null
          facility_id: string
          id: string
          on_date: string
          reason: string
          room_number: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          done_at?: string | null
          facility_id: string
          id?: string
          on_date: string
          reason: string
          room_number: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          done_at?: string | null
          facility_id?: string
          id?: string
          on_date?: string
          reason?: string
          room_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_facility_id_created_by_fkey"
            columns: ["facility_id", "created_by"]
            isOneToOne: false
            referencedRelation: "staff_accounts"
            referencedColumns: ["facility_id", "id"]
          },
          {
            foreignKeyName: "visits_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_facility_id_room_number_fkey"
            columns: ["facility_id", "room_number"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["facility_id", "number"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_in: {
        Args: { p_ends_on: string; p_room: string; p_starts_on: string }
        Returns: {
          checked_in_at: string
          checked_out_at: string | null
          ends_on: string
          facility_id: string
          id: string
          room_number: string
          starts_on: string
        }
        SetofOptions: {
          from: "*"
          to: "stays"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_out: {
        Args: { p_room: string }
        Returns: {
          assigned_to: string | null
          created_at: string
          due_on: string
          facility_id: string
          finished_at: string | null
          id: string
          kind: Database["public"]["Enums"]["clean_kind"]
          room_number: string
          started_at: string | null
          status: Database["public"]["Enums"]["cleaning_status"]
        }
        SetofOptions: {
          from: "*"
          to: "clean_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_maintenance_seen: {
        Args: { p_request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      clean_kind: "routine" | "deep"
      cleaning_status: "not_started" | "in_progress" | "done"
      department: "housekeeping" | "dining" | "maintenance" | "activities"
      event_kind: "activity" | "maintenance" | "dining" | "housekeeping"
      feedback_kind: "complaint" | "compliment"
      feedback_topic:
        | "food_temperature"
        | "food_taste"
        | "repairs_slow"
        | "room_cleanliness"
        | "noise"
        | "activity_variety"
        | "staff_response"
      maintenance_priority: "routine" | "urgent"
      maintenance_status: "open" | "in_progress" | "waiting" | "done"
      meal: "breakfast" | "lunch" | "dinner"
      module_id:
        | "rooms"
        | "housekeeping"
        | "hk_assign"
        | "dining"
        | "dining_order"
        | "dining_kitchen"
        | "dining_menus"
        | "dining_temps"
        | "dining_checklist"
        | "dining_survey"
        | "dining_manager"
        | "maintenance"
        | "maintenance_crew"
        | "calendar"
        | "attendance"
        | "pulse"
        | "residents"
        | "notices_send"
        | "access"
      occupancy: "vacant" | "occupied" | "needs_cleaning"
      order_status: "pending" | "preparing" | "ready" | "complete"
      order_type: "dine_in" | "to_go"
      staff_role:
        | "ops_manager"
        | "housekeeper"
        | "hk_director"
        | "nurse_station"
        | "kitchen"
        | "dining_manager"
        | "maintenance"
        | "activities"
      thumbs: "up" | "down"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      clean_kind: ["routine", "deep"],
      cleaning_status: ["not_started", "in_progress", "done"],
      department: ["housekeeping", "dining", "maintenance", "activities"],
      event_kind: ["activity", "maintenance", "dining", "housekeeping"],
      feedback_kind: ["complaint", "compliment"],
      feedback_topic: [
        "food_temperature",
        "food_taste",
        "repairs_slow",
        "room_cleanliness",
        "noise",
        "activity_variety",
        "staff_response",
      ],
      maintenance_priority: ["routine", "urgent"],
      maintenance_status: ["open", "in_progress", "waiting", "done"],
      meal: ["breakfast", "lunch", "dinner"],
      module_id: [
        "rooms",
        "housekeeping",
        "hk_assign",
        "dining",
        "dining_order",
        "dining_kitchen",
        "dining_menus",
        "dining_temps",
        "dining_checklist",
        "dining_survey",
        "dining_manager",
        "maintenance",
        "maintenance_crew",
        "calendar",
        "attendance",
        "pulse",
        "residents",
        "notices_send",
        "access",
      ],
      occupancy: ["vacant", "occupied", "needs_cleaning"],
      order_status: ["pending", "preparing", "ready", "complete"],
      order_type: ["dine_in", "to_go"],
      staff_role: [
        "ops_manager",
        "housekeeper",
        "hk_director",
        "nurse_station",
        "kitchen",
        "dining_manager",
        "maintenance",
        "activities",
      ],
      thumbs: ["up", "down"],
    },
  },
} as const
