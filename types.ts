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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_inventory: {
        Row: {
          asset_number: string | null
          asset_type: string
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          is_active: boolean
          legacy_id: string | null
          model: string | null
          serial: string | null
          status: string
          updated_at: string
        }
        Insert: {
          asset_number?: string | null
          asset_type: string
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          model?: string | null
          serial?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          asset_number?: string | null
          asset_type?: string
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          model?: string | null
          serial?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_inventory_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_logs: {
        Row: {
          asset_id: string | null
          asset_label: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          in_order: boolean
          issued_at: string
          issued_to: string
          legacy_id: string | null
          notes: string | null
          returned_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          asset_label?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          in_order?: boolean
          issued_at?: string
          issued_to: string
          legacy_id?: string | null
          notes?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          asset_label?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          in_order?: boolean
          issued_at?: string
          issued_to?: string
          legacy_id?: string | null
          notes?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_logs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "asset_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_logs_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      barrier_raise_logs: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          item: string | null
          legacy_id: string | null
          notes: string | null
          raised_at: string
          raised_by: string | null
          reason: string | null
          updated_at: string
          vehicle_reg: string | null
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          item?: string | null
          legacy_id?: string | null
          notes?: string | null
          raised_at?: string
          raised_by?: string | null
          reason?: string | null
          updated_at?: string
          vehicle_reg?: string | null
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          item?: string | null
          legacy_id?: string | null
          notes?: string | null
          raised_at?: string
          raised_by?: string | null
          reason?: string | null
          updated_at?: string
          vehicle_reg?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barrier_raise_logs_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bomb_threats: {
        Row: {
          caller_details: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          details: Json
          exact_wording: string | null
          extra: Json
          id: string
          legacy_id: string | null
          received_at: string
          received_by: string | null
          status: string
          threat_method: string | null
          updated_at: string
        }
        Insert: {
          caller_details?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          details?: Json
          exact_wording?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          received_at?: string
          received_by?: string | null
          status?: string
          threat_method?: string | null
          updated_at?: string
        }
        Update: {
          caller_details?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          details?: Json
          exact_wording?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          received_at?: string
          received_by?: string | null
          status?: string
          threat_method?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bomb_threats_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          asset: string | null
          booked_by: string | null
          booked_for: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          end_at: string
          extra: Json
          id: string
          legacy_id: string | null
          notes: string | null
          space: string | null
          start_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          asset?: string | null
          booked_by?: string | null
          booked_for?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          end_at: string
          extra?: Json
          id?: string
          legacy_id?: string | null
          notes?: string | null
          space?: string | null
          start_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          asset?: string | null
          booked_by?: string | null
          booked_for?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          end_at?: string
          extra?: Json
          id?: string
          legacy_id?: string | null
          notes?: string | null
          space?: string | null
          start_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      car_park_patrols: {
        Row: {
          checkpoints: Json
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          legacy_id: string | null
          notes: string | null
          officer_name: string
          patrol_end: string | null
          patrol_start: string
          status: string
          updated_at: string
        }
        Insert: {
          checkpoints?: Json
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          notes?: string | null
          officer_name: string
          patrol_end?: string | null
          patrol_start?: string
          status?: string
          updated_at?: string
        }
        Update: {
          checkpoints?: Json
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          notes?: string | null
          officer_name?: string
          patrol_end?: string | null
          patrol_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_park_patrols_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      cctv_logs: {
        Row: {
          control_room_id: string
          controller_name: string | null
          created_at: string
          created_by: string | null
          details: Json
          extra: Json
          id: string
          legacy_id: string | null
          log_type: string
          logged_at: string
          notes: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          controller_name?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          extra?: Json
          id?: string
          legacy_id?: string | null
          log_type: string
          logged_at?: string
          notes?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          controller_name?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          extra?: Json
          id?: string
          legacy_id?: string | null
          log_type?: string
          logged_at?: string
          notes?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cctv_logs_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      check_in_records: {
        Row: {
          access_reason: string | null
          archived: boolean
          badge_number: string | null
          booking_ref: string | null
          check_in_time: string
          check_out_time: string | null
          company: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          destination: string | null
          extra: Json
          full_name: string
          id: string
          legacy_id: string | null
          notes: string | null
          status: string
          updated_at: string
          visit_type: string
        }
        Insert: {
          access_reason?: string | null
          archived?: boolean
          badge_number?: string | null
          booking_ref?: string | null
          check_in_time?: string
          check_out_time?: string | null
          company?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          destination?: string | null
          extra?: Json
          full_name: string
          id?: string
          legacy_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Update: {
          access_reason?: string | null
          archived?: boolean
          badge_number?: string | null
          booking_ref?: string | null
          check_in_time?: string
          check_out_time?: string | null
          company?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          destination?: string | null
          extra?: Json
          full_name?: string
          id?: string
          legacy_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_records_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          control_room_id: string | null
          id: number
          new_data: Json | null
          occurred_at: string
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          control_room_id?: string | null
          id?: never
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          control_room_id?: string | null
          id?: never
          new_data?: Json | null
          occurred_at?: string
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      compliance_checks: {
        Row: {
          booking_id: string | null
          check_type: string
          checked_at: string
          checked_by: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          legacy_id: string | null
          notes: string | null
          passed: boolean
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          check_type: string
          checked_at?: string
          checked_by?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          notes?: string | null
          passed?: boolean
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          check_type?: string
          checked_at?: string
          checked_by?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          notes?: string | null
          passed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_checks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_checks_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_callouts: {
        Row: {
          attended_at: string | null
          called_at: string
          contractor_id: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          equipment: string | null
          extra: Json
          fault_description: string | null
          id: string
          legacy_id: string | null
          reference: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attended_at?: string | null
          called_at?: string
          contractor_id?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          equipment?: string | null
          extra?: Json
          fault_description?: string | null
          id?: string
          legacy_id?: string | null
          reference?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attended_at?: string | null
          called_at?: string
          contractor_id?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          equipment?: string | null
          extra?: Json
          fault_description?: string | null
          id?: string
          legacy_id?: string | null
          reference?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_callouts_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractor_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_callouts_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_inventory: {
        Row: {
          company: string
          control_room_id: string
          created_at: string
          created_by: string | null
          email: string | null
          emergency_phone: string | null
          extra: Json
          id: string
          is_active: boolean
          legacy_id: string | null
          services: string | null
          sla: string | null
          updated_at: string
        }
        Insert: {
          company: string
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_phone?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          services?: string | null
          sla?: string | null
          updated_at?: string
        }
        Update: {
          company?: string
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_phone?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          services?: string | null
          sla?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_inventory_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      control_room_members: {
        Row: {
          control_room_id: string
          id: string
          user_id: string
        }
        Insert: {
          control_room_id: string
          id?: string
          user_id: string
        }
        Update: {
          control_room_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "control_room_members_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      control_rooms: {
        Row: {
          checkin_token: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          checkin_token?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          checkin_token?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      ct_incidents: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          is_drill: boolean
          legacy_id: string | null
          logs: Json
          start_datetime: string
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          is_drill?: boolean
          legacy_id?: string | null
          logs?: Json
          start_datetime?: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          is_drill?: boolean
          legacy_id?: string | null
          logs?: Json
          start_datetime?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ct_incidents_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      defect_reports: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          description: string
          extra: Json
          id: string
          legacy_id: string | null
          location: string | null
          photo_url: string | null
          reference: string | null
          report_datetime: string
          reported_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          description: string
          extra?: Json
          id?: string
          legacy_id?: string | null
          location?: string | null
          photo_url?: string | null
          reference?: string | null
          report_datetime?: string
          reported_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          extra?: Json
          id?: string
          legacy_id?: string | null
          location?: string | null
          photo_url?: string | null
          reference?: string | null
          report_datetime?: string
          reported_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "defect_reports_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      evacuation_events: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          extra: Json
          id: string
          is_drill: boolean
          legacy_id: string | null
          reason: string | null
          started_at: string
          started_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          extra?: Json
          id?: string
          is_drill?: boolean
          legacy_id?: string | null
          reason?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          extra?: Json
          id?: string
          is_drill?: boolean
          legacy_id?: string | null
          reason?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evacuation_events_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      fire_logs: {
        Row: {
          comments: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          details: Json
          extra: Json
          id: string
          legacy_id: string | null
          log_type: string
          logged_at: string
          reference: string | null
          result: string | null
          tested_by: string | null
          updated_at: string
        }
        Insert: {
          comments?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          details?: Json
          extra?: Json
          id?: string
          legacy_id?: string | null
          log_type: string
          logged_at?: string
          reference?: string | null
          result?: string | null
          tested_by?: string | null
          updated_at?: string
        }
        Update: {
          comments?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          details?: Json
          extra?: Json
          id?: string
          legacy_id?: string | null
          log_type?: string
          logged_at?: string
          reference?: string | null
          result?: string | null
          tested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fire_logs_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      found_properties: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          description: string
          destroyed: string | null
          extra: Json
          found_by: string | null
          id: string
          item_date: string
          item_number: string | null
          legacy_id: string | null
          notes: string | null
          owner_contacted: string | null
          record_type: string
          returned: string | null
          status: string
          updated_at: string
          where_stored: string | null
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          description: string
          destroyed?: string | null
          extra?: Json
          found_by?: string | null
          id?: string
          item_date?: string
          item_number?: string | null
          legacy_id?: string | null
          notes?: string | null
          owner_contacted?: string | null
          record_type?: string
          returned?: string | null
          status?: string
          updated_at?: string
          where_stored?: string | null
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          destroyed?: string | null
          extra?: Json
          found_by?: string | null
          id?: string
          item_date?: string
          item_number?: string | null
          legacy_id?: string | null
          notes?: string | null
          owner_contacted?: string | null
          record_type?: string
          returned?: string | null
          status?: string
          updated_at?: string
          where_stored?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "found_properties_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_reports: {
        Row: {
          author: string | null
          checklist: Json
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          issues: string | null
          legacy_id: string | null
          reference: string | null
          shift: string | null
          shift_date: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          author?: string | null
          checklist?: Json
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          issues?: string | null
          legacy_id?: string | null
          reference?: string | null
          shift?: string | null
          shift_date?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          author?: string | null
          checklist?: Json
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          issues?: string | null
          legacy_id?: string | null
          reference?: string | null
          shift?: string | null
          shift_date?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_reports_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      key_audits: {
        Row: {
          audit_date: string
          auditor_name: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          issues: Json
          legacy_id: string | null
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          audit_date?: string
          auditor_name?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          issues?: Json
          legacy_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          audit_date?: string
          auditor_name?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          issues?: Json
          legacy_id?: string | null
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_audits_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      key_inventory: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          description: string | null
          extra: Json
          id: string
          is_active: boolean
          item_type: string
          key_number: string | null
          key_press_colour: string | null
          legacy_id: string | null
          pass_number: string | null
          total_keys_on_bunch: number | null
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          item_type?: string
          key_number?: string | null
          key_press_colour?: string | null
          legacy_id?: string | null
          pass_number?: string | null
          total_keys_on_bunch?: number | null
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          item_type?: string
          key_number?: string | null
          key_press_colour?: string | null
          legacy_id?: string | null
          pass_number?: string | null
          total_keys_on_bunch?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_inventory_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      key_logs: {
        Row: {
          company: string | null
          control_room_id: string
          count_mismatch: boolean
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          issued_at: string
          issued_to: string
          item_label: string | null
          key_id: string | null
          keys_out: number | null
          keys_returned: number | null
          legacy_id: string | null
          notes: string | null
          returned_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          control_room_id?: string
          count_mismatch?: boolean
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          issued_at?: string
          issued_to: string
          item_label?: string | null
          key_id?: string | null
          keys_out?: number | null
          keys_returned?: number | null
          legacy_id?: string | null
          notes?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          control_room_id?: string
          count_mismatch?: boolean
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          issued_at?: string
          issued_to?: string
          item_label?: string | null
          key_id?: string | null
          keys_out?: number | null
          keys_returned?: number | null
          legacy_id?: string | null
          notes?: string | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_logs_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_logs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "key_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      muster_records: {
        Row: {
          checked_at: string | null
          company: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          event_id: string | null
          extra: Json
          id: string
          legacy_id: string | null
          name: string
          notes: string | null
          people: number
          ref: string | null
          status: string
          updated_at: string
        }
        Insert: {
          checked_at?: string | null
          company?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          name: string
          notes?: string | null
          people?: number
          ref?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          checked_at?: string | null
          company?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          name?: string
          notes?: string | null
          people?: number
          ref?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "muster_records_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "muster_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "evacuation_events"
            referencedColumns: ["id"]
          },
        ]
      }
      out_of_hours_contacts: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          email: string | null
          extra: Json
          id: string
          legacy_id: string | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "out_of_hours_contacts_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "out_of_hours_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          page_permissions: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          page_permissions?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          page_permissions?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      radon_tests: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          legacy_id: string | null
          level: number | null
          location: string | null
          notes: string | null
          status: string
          test_finish: string | null
          test_start: string
          tested_by: string | null
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          level?: number | null
          location?: string | null
          notes?: string | null
          status?: string
          test_finish?: string | null
          test_start?: string
          tested_by?: string | null
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          level?: number | null
          location?: string | null
          notes?: string | null
          status?: string
          test_finish?: string | null
          test_start?: string
          tested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "radon_tests_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_shifts: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          legacy_id: string | null
          member_id: string | null
          notes: string | null
          shift_code: string
          shift_date: string
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          member_id?: string | null
          notes?: string | null
          shift_code: string
          shift_date: string
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          member_id?: string | null
          notes?: string | null
          shift_code?: string
          shift_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_shifts_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_shifts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_checkoffs: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          hours: number | null
          id: string
          legacy_id: string | null
          member_id: string | null
          notes: string | null
          shift_date: string
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          hours?: number | null
          id?: string
          legacy_id?: string | null
          member_id?: string | null
          notes?: string | null
          shift_date: string
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          hours?: number | null
          id?: string
          legacy_id?: string | null
          member_id?: string | null
          notes?: string | null
          shift_date?: string
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_checkoffs_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_checkoffs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      spillage_logs: {
        Row: {
          cleaned_at: string | null
          cleaned_by: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          legacy_id: string | null
          location: string | null
          notes: string | null
          reported_by: string | null
          spill_type: string | null
          spill_type_other: string | null
          spilled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          cleaned_at?: string | null
          cleaned_by?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          location?: string | null
          notes?: string | null
          reported_by?: string | null
          spill_type?: string | null
          spill_type_other?: string | null
          spilled_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cleaned_at?: string | null
          cleaned_by?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          location?: string | null
          notes?: string | null
          reported_by?: string | null
          spill_type?: string | null
          spill_type_other?: string | null
          spilled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spillage_logs_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_login_logs: {
        Row: {
          email: string | null
          id: string
          login_at: string
          role: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          login_at?: string
          role?: string | null
          user_id?: string
          user_name?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          login_at?: string
          role?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          email: string | null
          extra: Json
          id: string
          is_active: boolean
          legacy_id: string | null
          name: string
          phone: string | null
          role_group: string | null
          team: string
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          name: string
          phone?: string | null
          role_group?: string | null
          team?: string
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          extra?: Json
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          name?: string
          phone?: string | null
          role_group?: string | null
          team?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          floor: string | null
          goods_lift_number: string | null
          id: string
          is_active: boolean
          legacy_id: string | null
          loading_bays: string | null
          name: string
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          floor?: string | null
          goods_lift_number?: string | null
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          loading_bays?: string | null
          name: string
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          floor?: string | null
          goods_lift_number?: string | null
          id?: string
          is_active?: boolean
          legacy_id?: string | null
          loading_bays?: string | null
          name?: string
          unit_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_levels: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          legacy_id: string | null
          level: string
          notes: string | null
          set_at: string
          set_by: string | null
          updated_at: string
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          level: string
          notes?: string | null
          set_at?: string
          set_by?: string | null
          updated_at?: string
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          level?: string
          notes?: string | null
          set_at?: string
          set_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_levels_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          assessed_at: string | null
          assessor: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          legacy_id: string | null
          member_id: string | null
          method: string | null
          module: string | null
          notes: string | null
          programme: string | null
          section: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assessed_at?: string | null
          assessor?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          member_id?: string | null
          method?: string | null
          module?: string | null
          notes?: string | null
          programme?: string | null
          section?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assessed_at?: string | null
          assessor?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          member_id?: string | null
          method?: string | null
          module?: string | null
          notes?: string | null
          programme?: string | null
          section?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_records_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vacant_unit_checks: {
        Row: {
          answers: Json
          checked_at: string
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          inspector: string | null
          legacy_id: string | null
          notes: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          checked_at?: string
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          inspector?: string | null
          legacy_id?: string | null
          notes?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          checked_at?: string
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          inspector?: string | null
          legacy_id?: string | null
          notes?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacant_unit_checks_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_visits: {
        Row: {
          archived: boolean
          check_in_time: string
          check_out_time: string | null
          control_room_id: string
          created_at: string
          created_by: string | null
          destination_tenant: string | null
          driver_company: string | null
          driver_name: string | null
          extra: Json
          id: string
          legacy_id: string | null
          licence_plate: string
          notes: string | null
          status: string
          updated_at: string
          vehicle_pass: string | null
        }
        Insert: {
          archived?: boolean
          check_in_time?: string
          check_out_time?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          destination_tenant?: string | null
          driver_company?: string | null
          driver_name?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          licence_plate: string
          notes?: string | null
          status?: string
          updated_at?: string
          vehicle_pass?: string | null
        }
        Update: {
          archived?: boolean
          check_in_time?: string
          check_out_time?: string | null
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          destination_tenant?: string | null
          driver_company?: string | null
          driver_name?: string | null
          extra?: Json
          id?: string
          legacy_id?: string | null
          licence_plate?: string
          notes?: string | null
          status?: string
          updated_at?: string
          vehicle_pass?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_visits_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_logs: {
        Row: {
          control_room_id: string
          created_at: string
          created_by: string | null
          extra: Json
          id: string
          inside_temp: number | null
          legacy_id: string | null
          logged_at: string
          notes: string | null
          outside_temp: number | null
          recorded_by: string | null
          reference: string | null
          updated_at: string
          weather: string | null
          wind: string | null
        }
        Insert: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          inside_temp?: number | null
          legacy_id?: string | null
          logged_at?: string
          notes?: string | null
          outside_temp?: number | null
          recorded_by?: string | null
          reference?: string | null
          updated_at?: string
          weather?: string | null
          wind?: string | null
        }
        Update: {
          control_room_id?: string
          created_at?: string
          created_by?: string | null
          extra?: Json
          id?: string
          inside_temp?: number | null
          legacy_id?: string | null
          logged_at?: string
          notes?: string | null
          outside_temp?: number | null
          recorded_by?: string | null
          reference?: string | null
          updated_at?: string
          weather?: string | null
          wind?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_logs_control_room_id_fkey"
            columns: ["control_room_id"]
            isOneToOne: false
            referencedRelation: "control_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_room: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      in_room: { Args: { _room: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "security"
        | "kiosk"
        | "patrol"
        | "cleaner"
        | "user"
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
      app_role: [
        "admin",
        "manager",
        "security",
        "kiosk",
        "patrol",
        "cleaner",
        "user",
      ],
    },
  },
} as const
