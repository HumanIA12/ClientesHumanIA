'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { qk } from '@/lib/query-keys'
import type {
  Tables,
  TablesInsert,
  TransactionType,
  Sharing,
} from '@/lib/types/database'

export type Transaction = Tables<'transactions'>
export type TransactionInsert = TablesInsert<'transactions'>

export interface TransactionFilters {
  /** Tipos de transacción a incluir. Default: todas. */
  types?: TransactionType[]
  /** ID de cuenta — incluye también target_account_id. */
  accountId?: string
  /** ID de categoría. */
  categoryId?: string
  /** Búsqueda por descripción (case-insensitive). */
  search?: string
  /** Fecha mínima (ISO). */
  from?: string
  /** Fecha máxima (ISO). */
  to?: string
  /** Compartido o personal. */
  sharing?: Sharing
}

const PAGE_SIZE = 25

export interface TransactionsPage {
  rows: Transaction[]
  nextOffset: number | null
}

/**
 * Lista infinite-scroll de transacciones con filtros opcionales.
 * Filtra deleted_at IS NULL y ordena por performed_at desc.
 */
export function useTransactions(filters: TransactionFilters = {}) {
  const supabase = createClient()
  const filterKey = JSON.stringify(filters)

  return useInfiniteQuery<
    TransactionsPage,
    Error,
    InfiniteData<TransactionsPage>,
    readonly unknown[],
    number
  >({
    queryKey: qk.transactions({ filterKey }),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('performed_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (filters.types && filters.types.length > 0) {
        query = query.in('type', filters.types)
      }
      if (filters.accountId) {
        query = query.or(
          `account_id.eq.${filters.accountId},target_account_id.eq.${filters.accountId}`
        )
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters.search && filters.search.trim() !== '') {
        const term = filters.search.replace(/[%_]/g, '\\$&')
        query = query.ilike('description', `%${term}%`)
      }
      if (filters.from) query = query.gte('performed_at', filters.from)
      if (filters.to) query = query.lte('performed_at', filters.to)
      if (filters.sharing) query = query.eq('sharing', filters.sharing)

      const { data, error } = await query
      if (error) throw error

      const rows = data ?? []
      const nextOffset =
        rows.length < PAGE_SIZE ? null : offset + rows.length
      return { rows, nextOffset }
    },
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  })
}

export interface NewTransactionPayload {
  type: TransactionType
  amount: number
  account_id: string
  target_account_id?: string | null
  category_id?: string | null
  description?: string | null
  notes?: string | null
  performed_at: string
  performed_by?: string | null
  sharing: Sharing
  currency?: string
}

/**
 * Crea una transacción. household_id y registered_by se resuelven
 * desde el usuario autenticado. El trigger SQL se encarga de
 * actualizar el current_balance de las cuentas afectadas.
 */
export function useCreateTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: NewTransactionPayload) => {
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

      const insert: TransactionInsert = {
        household_id: profile.household_id,
        type: payload.type,
        amount: payload.amount,
        account_id: payload.account_id,
        target_account_id: payload.target_account_id ?? null,
        category_id: payload.category_id ?? null,
        description: payload.description ?? null,
        notes: payload.notes ?? null,
        performed_at: payload.performed_at,
        performed_by: payload.performed_by ?? user.id,
        registered_by: user.id,
        sharing: payload.sharing,
        currency: payload.currency ?? 'MXN',
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.transactions() })
      void queryClient.invalidateQueries({ queryKey: qk.accounts() })
    },
  })
}

import { useQuery } from '@tanstack/react-query'

export function useTransactionQuery(id: string | undefined) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['transactions', 'one', id ?? 'none'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id!)
        .is('deleted_at', null)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<TransactionInsert>
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: qk.transactions() })
      void queryClient.invalidateQueries({ queryKey: qk.accounts() })
      void queryClient.invalidateQueries({
        queryKey: ['transactions', 'one', vars.id],
      })
    },
  })
}

export function useDeleteTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.transactions() })
      void queryClient.invalidateQueries({ queryKey: qk.accounts() })
    },
  })
}
