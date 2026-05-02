'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import {
  endOfMonth,
  format,
  startOfMonth,
} from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert } from '@/lib/types/database'

export type Budget = Tables<'budgets'>
export type BudgetInsert = TablesInsert<'budgets'>

export interface BudgetProgress {
  budget: Budget
  /** Total gastado del mes en esa categoría (sólo type='expense'). */
  spent: number
  /** Porcentaje 0-100+. */
  percent: number
  /** spent - amount; positivo = excedente. */
  delta: number
}

interface CategoryExpenseRow {
  category_id: string | null
  amount: number
}

/**
 * Lista presupuestos del mes pedido (default mes actual). El modelo
 * permite presupuestos con cualquier rango pero la UI los maneja como
 * mensuales: period_start = primer día del mes, period_end = último.
 */
export function useBudgets(asOf: Date = new Date()): UseQueryResult<Budget[]> {
  const supabase = createClient()
  const periodStart = format(startOfMonth(asOf), 'yyyy-MM-dd')
  return useQuery({
    queryKey: ['budgets', periodStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .is('deleted_at', null)
        .eq('period_start', periodStart)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Devuelve los presupuestos del mes con el gasto efectivo por
 * categoría. Hace una sola consulta para todas las categorías y
 * cruza en cliente.
 */
export function useBudgetsWithProgress(
  asOf: Date = new Date()
): UseQueryResult<BudgetProgress[]> {
  const supabase = createClient()
  const monthStart = startOfMonth(asOf)
  const monthEnd = endOfMonth(asOf)
  const periodStart = format(monthStart, 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['budgets', 'progress', periodStart],
    queryFn: async () => {
      // 1) Presupuestos del mes
      const { data: budgets, error: bErr } = await supabase
        .from('budgets')
        .select('*')
        .is('deleted_at', null)
        .eq('period_start', periodStart)
        .order('created_at', { ascending: true })
      if (bErr) throw bErr

      if (!budgets || budgets.length === 0) return []

      // 2) Gasto del mes por categoría
      const { data: txs, error: tErr } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .is('deleted_at', null)
        .eq('type', 'expense')
        .gte('performed_at', monthStart.toISOString())
        .lte('performed_at', monthEnd.toISOString())
        .in(
          'category_id',
          budgets.map((b) => b.category_id)
        )
      if (tErr) throw tErr

      const spentMap = new Map<string, number>()
      for (const r of (txs ?? []) as CategoryExpenseRow[]) {
        if (!r.category_id) continue
        spentMap.set(
          r.category_id,
          (spentMap.get(r.category_id) ?? 0) + Number(r.amount)
        )
      }

      return budgets.map<BudgetProgress>((b) => {
        const spent = spentMap.get(b.category_id) ?? 0
        const target = Number(b.amount)
        const percent = target > 0 ? (spent / target) * 100 : 0
        return { budget: b, spent, percent, delta: spent - target }
      })
    },
    staleTime: 30 * 1000,
  })
}

export interface NewBudgetPayload {
  category_id: string
  amount: number
  /** Fecha del primer día del mes (yyyy-MM-dd). */
  period_start: string
  currency?: string
}

export function useUpsertBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: NewBudgetPayload) => {
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

      const start = new Date(payload.period_start)
      const end = format(endOfMonth(start), 'yyyy-MM-dd')

      // Si ya existe un presupuesto para esa categoría+mes (constraint
      // unique), lo actualizamos. Si no, insertamos.
      const { data: existing, error: findErr } = await supabase
        .from('budgets')
        .select('id, deleted_at')
        .eq('household_id', profile.household_id)
        .eq('category_id', payload.category_id)
        .eq('period_start', payload.period_start)
        .maybeSingle()
      if (findErr) throw findErr

      if (existing) {
        const { data, error } = await supabase
          .from('budgets')
          .update({
            amount: payload.amount,
            currency: payload.currency ?? 'MXN',
            deleted_at: null,
            period_end: end,
          })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        return data
      }

      const insert: BudgetInsert = {
        household_id: profile.household_id,
        category_id: payload.category_id,
        period_start: payload.period_start,
        period_end: end,
        amount: payload.amount,
        currency: payload.currency ?? 'MXN',
      }
      const { data, error } = await supabase
        .from('budgets')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useDeleteBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
