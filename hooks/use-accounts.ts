'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { qk } from '@/lib/query-keys'
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/types/database'

export type Account = Tables<'accounts'>
export type AccountInsert = TablesInsert<'accounts'>
export type AccountUpdate = TablesUpdate<'accounts'>

/**
 * Lista cuentas no eliminadas (RLS filtra por household automáticamente).
 * Ordenadas por nombre. Cuentas archivadas se incluyen pero pueden
 * filtrarse en UI con `account.is_archived`.
 */
export function useAccounts(): UseQueryResult<Account[]> {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.accounts(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useAccount(id: string | undefined): UseQueryResult<Account> {
  const supabase = createClient()
  return useQuery({
    queryKey: id ? qk.account(id) : ['accounts', 'none'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id!)
        .is('deleted_at', null)
        .single()
      if (error) throw error
      return data
    },
  })
}

export interface NewAccountPayload {
  name: string
  type: AccountInsert['type']
  currency?: string
  owner_profile_id?: string | null
  color?: string
  starting_balance: number
  credit_limit?: number | null
}

/**
 * Crea una cuenta. household_id se obtiene del profile del usuario
 * actual. starting_balance también se usa como current_balance inicial.
 */
export function useCreateAccount() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: NewAccountPayload) => {
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

      const insert: AccountInsert = {
        household_id: profile.household_id,
        name: payload.name,
        type: payload.type,
        currency: payload.currency ?? 'MXN',
        owner_profile_id: payload.owner_profile_id ?? null,
        color: payload.color ?? '#1E6B4A',
        starting_balance: payload.starting_balance,
        current_balance: payload.starting_balance,
        credit_limit: payload.credit_limit ?? null,
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.accounts() })
    },
  })
}

export function useUpdateAccount() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: AccountUpdate
    }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: qk.accounts() })
      void queryClient.invalidateQueries({ queryKey: qk.account(variables.id) })
    },
  })
}

/**
 * Soft delete: setea deleted_at = now(). El registro queda fuera del
 * useAccounts() por el filtro is('deleted_at', null).
 */
export function useArchiveAccount() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.accounts() })
    },
  })
}
