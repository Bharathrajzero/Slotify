export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      assigned_shifts: {
        Row: {
          id: string
          employee_id: string
          job_id: string | null
          shift_date: string
          shift_index: "0" | "1" | "2"
          is_sick_leave: boolean
          is_manual_override: boolean
          overridden_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          job_id?: string | null
          shift_date: string
          shift_index: "0" | "1" | "2"
          is_sick_leave?: boolean
          is_manual_override?: boolean
          overridden_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          job_id?: string | null
          shift_date?: string
          shift_index?: "0" | "1" | "2"
          is_sick_leave?: boolean
          is_manual_override?: boolean
          overridden_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employee_constraints: {
        Row: {
          id: string
          employee_id: string
          day_of_week: number
          shift_index: "0" | "1" | "2"
          is_hard_constraint: boolean
          preference_weight: number
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          day_of_week: number
          shift_index: "0" | "1" | "2"
          is_hard_constraint?: boolean
          preference_weight?: number
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          day_of_week?: number
          shift_index?: "0" | "1" | "2"
          is_hard_constraint?: boolean
          preference_weight?: number
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          full_name: string
          email: string
          role: "junior_staff" | "senior_staff" | "manager"
          supervisor_id: string | null
          max_hours_per_week: number
          hourly_rate: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          role?: "junior_staff" | "senior_staff" | "manager"
          supervisor_id?: string | null
          max_hours_per_week?: number
          hourly_rate?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: "junior_staff" | "senior_staff" | "manager"
          supervisor_id?: string | null
          max_hours_per_week?: number
          hourly_rate?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      schedule_jobs: {
        Row: {
          id: string
          requested_by: string
          week_start_date: string
          status: "pending" | "processing" | "completed" | "failed"
          input_payload: Json
          result_payload: Json | null
          error_message: string | null
          solver_wall_time_ms: number | null
          created_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          requested_by: string
          week_start_date: string
          status?: "pending" | "processing" | "completed" | "failed"
          input_payload: Json
          result_payload?: Json | null
          error_message?: string | null
          solver_wall_time_ms?: number | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          requested_by?: string
          week_start_date?: string
          status?: "pending" | "processing" | "completed" | "failed"
          input_payload?: Json
          result_payload?: Json | null
          error_message?: string | null
          solver_wall_time_ms?: number | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
    }
  }
}