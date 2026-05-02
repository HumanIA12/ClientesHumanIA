'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert } from '@/lib/types/database'

export type Reminder = Tables<'reminders'>
export type ReminderInsert = TablesInsert<'reminders'>

const KEY = ['reminders'] as const

export function useReminders(): UseQueryResult<Reminder[]> {
  const supabase = createClient()
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .is('deleted_at', null)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,
  })
}

export interface NewReminderPayload {
  title: string
  due_date: string
  amount?: number | null
  account_id?: string | null
}

export function useCreateReminder() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: NewReminderPayload) => {
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

      const insert: ReminderInsert = {
        household_id: profile.household_id,
        title: payload.title,
        due_date: payload.due_date,
        amount: payload.amount ?? null,
        account_id: payload.account_id ?? null,
      }
      const { data, error } = await supabase
        .from('reminders')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useUpdateReminder() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<ReminderInsert>
    }) => {
      const { data, error } = await supabase
        .from('reminders')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}

export function useDeleteReminder() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reminders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}
