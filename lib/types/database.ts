/**
 * Tipos generados/manuales para la base de datos de NEXO.
 * Reflejan el schema SQL en /supabase/schema.sql.
 *
 * Cuando se conecte el proyecto real, regenerar con:
 *   npx supabase gen types typescript --project-id <id> > lib/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AccountType =
  | 'checking'
  | 'savings'
  | 'cash'
  | 'credit_card'
  | 'investment'
  | 'loan'
  | 'other'

export type TransactionType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'credit_payment'

export type Sharing = 'shared' | 'personal'

export type RecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'yearly'

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          currency: string
          safe_buffer: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          currency?: string
          safe_buffer?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['households']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          household_id: string
          display_name: string
          avatar_color: string
          email: string | null
          created_at: string
        }
        Insert: {
          id: string
          household_id: string
          display_name: string
          avatar_color?: string
          email?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          household_id: string
          name: string
          type: AccountType
          currency: string
          owner_profile_id: string | null
          color: string
          icon: string | null
          credit_limit: number | null
          starting_balance: number
          current_balance: number
          is_archived: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          type: AccountType
          currency?: string
          owner_profile_id?: string | null
          color?: string
          icon?: string | null
          credit_limit?: number | null
          starting_balance?: number
          current_balance?: number
          is_archived?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          household_id: string
          name: string
          icon: string
          color: string
          parent_id: string | null
          kind: TransactionType
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          icon?: string
          color?: string
          parent_id?: string | null
          kind?: TransactionType
          deleted_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          household_id: string
          account_id: string
          target_account_id: string | null
          category_id: string | null
          type: TransactionType
          amount: number
          currency: string
          description: string | null
          notes: string | null
          performed_at: string
          performed_by: string | null
          registered_by: string
          sharing: Sharing
          recurring_rule_id: string | null
          installment_plan_id: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          account_id: string
          target_account_id?: string | null
          category_id?: string | null
          type: TransactionType
          amount: number
          currency?: string
          description?: string | null
          notes?: string | null
          performed_at: string
          performed_by?: string | null
          registered_by: string
          sharing?: Sharing
          recurring_rule_id?: string | null
          installment_plan_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
        Relationships: []
      }
      recurring_rules: {
        Row: {
          id: string
          household_id: string
          name: string
          account_id: string
          category_id: string | null
          type: TransactionType
          amount: number
          currency: string
          frequency: RecurrenceFrequency
          start_date: string
          end_date: string | null
          next_run_date: string
          performed_by: string | null
          sharing: Sharing
          is_active: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          account_id: string
          category_id?: string | null
          type: TransactionType
          amount: number
          currency?: string
          frequency: RecurrenceFrequency
          start_date: string
          end_date?: string | null
          next_run_date: string
          performed_by?: string | null
          sharing?: Sharing
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['recurring_rules']['Insert']
        >
        Relationships: []
      }
      installment_plans: {
        Row: {
          id: string
          household_id: string
          account_id: string
          category_id: string | null
          description: string
          total_amount: number
          installments_count: number
          installment_amount: number
          currency: string
          start_date: string
          performed_by: string | null
          sharing: Sharing
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          account_id: string
          category_id?: string | null
          description: string
          total_amount: number
          installments_count: number
          installment_amount: number
          currency?: string
          start_date: string
          performed_by?: string | null
          sharing?: Sharing
          deleted_at?: string | null
          created_at?: string
        }
        Update: Partial<
          Database['public']['Tables']['installment_plans']['Insert']
        >
        Relationships: []
      }
      budgets: {
        Row: {
          id: string
          household_id: string
          category_id: string
          period_start: string
          period_end: string
          amount: number
          currency: string
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          category_id: string
          period_start: string
          period_end: string
          amount: number
          currency?: string
          deleted_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['budgets']['Insert']>
        Relationships: []
      }
      reminders: {
        Row: {
          id: string
          household_id: string
          title: string
          due_date: string
          amount: number | null
          account_id: string | null
          is_completed: boolean
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          title: string
          due_date: string
          amount?: number | null
          account_id?: string | null
          is_completed?: boolean
          deleted_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          household_id: string
          actor_id: string
          entity: string
          entity_id: string
          action: string
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          actor_id: string
          entity: string
          entity_id: string
          action: string
          payload?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>
        Relationships: []
      }
      attachments: {
        Row: {
          id: string
          household_id: string
          transaction_id: string | null
          storage_path: string
          file_name: string
          mime_type: string | null
          size_bytes: number | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          transaction_id?: string | null
          storage_path: string
          file_name: string
          mime_type?: string | null
          size_bytes?: number | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['attachments']['Insert']>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_default_categories: {
        Args: Record<string, never>
        Returns: number
      }
      materialize_due_recurrences: {
        Args: Record<string, never>
        Returns: number
      }
    }
    Enums: {
      account_type: AccountType
      transaction_type: TransactionType
      sharing_type: Sharing
      recurrence_frequency: RecurrenceFrequency
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
