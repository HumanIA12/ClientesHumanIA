'use client'

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { addDays, addMonths, addWeeks, addYears } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { qk } from '@/lib/query-keys'
import type {
  TablesInsert,
  RecurrenceFrequency,
  TransactionType,
  Sharing,
} from '@/lib/types/database'

export interface NewRecurringPayload {
  name: string
  account_id: string
  category_id?: string | null
  type: TransactionType
  amount: number
  frequency: RecurrenceFrequency
  start_date: string
  end_date?: string | null
  next_run_date?: string
  performed_by?: string | null
  sharing: Sharing
  currency?: string
}

export function nextDateFromFrequency(
  freq: RecurrenceFrequency,
  from: Date
): Date {
  switch (freq) {
    case 'daily':
      return addDays(from, 1)
    case 'weekly':
      return addWeeks(from, 1)
    case 'biweekly':
      return addWeeks(from, 2)
    case 'monthly':
      return addMonths(from, 1)
    case 'yearly':
      return addYears(from, 1)
  }
}

export function useCreateRecurring() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: NewRecurringPayload) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()
      if (profileError) throw profileError

      const insert: TablesInsert<'recurring_rules'> = {
        household_id: profile.household_id,
        name: payload.name,
        account_id: payload.account_id,
        category_id: payload.category_id ?? null,
        type: payload.type,
        amount: payload.amount,
        currency: payload.currency ?? 'MXN',
        frequency: payload.frequency,
        start_date: payload.start_date,
        end_date: payload.end_date ?? null,
        next_run_date: payload.next_run_date ?? payload.start_date,
        performed_by: payload.performed_by ?? null,
        sharing: payload.sharing,
        is_active: true,
      }
      const { data, error } = await supabase
        .from('recurring_rules')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.recurringRules() })
    },
  })
}

export function useUpdateRecurring() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<TablesInsert<'recurring_rules'>>
    }) => {
      const { data, error } = await supabase
        .from('recurring_rules')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.recurringRules() })
    },
  })
}

export function useDeleteRecurring() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_rules')
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.recurringRules() })
    },
  })
}

/**
 * Aplica todas las reglas con next_run_date <= hoy creando sus
 * transacciones derivadas. Devuelve el número de transacciones
 * generadas. Después invalida cuentas, transacciones y reglas.
 */
export function useMaterializeDueRecurrences() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc(
        'materialize_due_recurrences'
      )
      if (error) throw error
      return data ?? 0
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.recurringRules() })
      void queryClient.invalidateQueries({ queryKey: qk.transactions() })
      void queryClient.invalidateQueries({ queryKey: qk.accounts() })
    },
  })
}
