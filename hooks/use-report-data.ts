'use client'

import { useQuery } from '@tanstack/react-query'
import {
  startOfMonth,
  endOfMonth,
  format,
  subMonths,
} from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { TransactionType } from '@/lib/types/database'

interface ExpenseByCategoryRow {
  category_id: string | null
  amount: number
  type: TransactionType
}

export interface ExpenseByCategoryItem {
  categoryId: string | null
  total: number
}

export function useExpenseByCategory(asOf: Date = new Date()) {
  const supabase = createClient()
  const from = startOfMonth(asOf).toISOString()
  const to = endOfMonth(asOf).toISOString()
  return useQuery({
    queryKey: ['report', 'expense-by-category', from, to],
    queryFn: async (): Promise<ExpenseByCategoryItem[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('category_id, amount, type')
        .is('deleted_at', null)
        .eq('type', 'expense')
        .gte('performed_at', from)
        .lte('performed_at', to)
      if (error) throw error
      const rows = (data ?? []) as ExpenseByCategoryRow[]
      const map = new Map<string | null, number>()
      for (const r of rows) {
        map.set(
          r.category_id,
          (map.get(r.category_id) ?? 0) + Number(r.amount)
        )
      }
      return Array.from(map.entries())
        .map(([categoryId, total]) => ({ categoryId, total }))
        .sort((a, b) => b.total - a.total)
    },
    staleTime: 60 * 1000,
  })
}

export interface MonthlyTrendItem {
  monthKey: string
  monthLabel: string
  income: number
  expenses: number
  net: number
}

interface TrendRow {
  type: TransactionType
  amount: number
  performed_at: string
}

/**
 * Tendencia mensual de los últimos N meses (default 6, incluye mes
 * actual). Excluye credit_payment de gastos como exige la regla.
 */
export function useMonthlyTrend(months = 6, asOf: Date = new Date()) {
  const supabase = createClient()
  const start = startOfMonth(subMonths(asOf, months - 1))
  const end = endOfMonth(asOf)
  return useQuery({
    queryKey: [
      'report',
      'monthly-trend',
      start.toISOString(),
      end.toISOString(),
      months,
    ],
    queryFn: async (): Promise<MonthlyTrendItem[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, performed_at')
        .is('deleted_at', null)
        .gte('performed_at', start.toISOString())
        .lte('performed_at', end.toISOString())
      if (error) throw error
      const rows = (data ?? []) as TrendRow[]

      // Inicializar el rango para tener todos los meses aunque sean vacíos.
      const buckets = new Map<string, MonthlyTrendItem>()
      for (let i = months - 1; i >= 0; i--) {
        const d = subMonths(asOf, i)
        const key = format(d, 'yyyy-MM')
        buckets.set(key, {
          monthKey: key,
          monthLabel: format(d, 'MMM'),
          income: 0,
          expenses: 0,
          net: 0,
        })
      }

      for (const r of rows) {
        const key = format(new Date(r.performed_at), 'yyyy-MM')
        const bucket = buckets.get(key)
        if (!bucket) continue
        const amt = Number(r.amount)
        if (r.type === 'income') bucket.income += amt
        else if (r.type === 'expense') bucket.expenses += amt
        // transfer y credit_payment no entran en el reporte.
      }
      for (const b of buckets.values()) b.net = b.income - b.expenses
      return Array.from(buckets.values())
    },
    staleTime: 60 * 1000,
  })
}
