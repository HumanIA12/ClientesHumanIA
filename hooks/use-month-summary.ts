'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { startOfMonth, endOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Sharing, TransactionType } from '@/lib/types/database'

export interface MonthSummary {
  /** Suma de gastos del mes (excluye credit_payment, regla de negocio). */
  expenses: number
  /** Suma de ingresos del mes. */
  income: number
  /** Número de movimientos contados. */
  count: number
  /** Total compartido (sólo gastos sharing='shared'). */
  sharedExpenses: number
  /** Total personal (sólo gastos sharing='personal'). */
  personalExpenses: number
  /** Gastos compartidos por persona (key = profile id). */
  sharedExpensesByPerson: Record<string, number>
}

interface Row {
  type: TransactionType
  amount: number
  performed_by: string | null
  sharing: Sharing
}

/**
 * Resumen del mes actual a partir de transactions.
 *
 * Importante: los pagos de tarjeta (credit_payment) NO se cuentan
 * como gasto en reportes — se excluyen de `expenses`. Se respeta el
 * filtro `deleted_at IS NULL`. Toda la agregación se hace en cliente
 * tras pedir un select con sólo las columnas necesarias.
 */
export function useMonthSummary(
  asOf: Date = new Date()
): UseQueryResult<MonthSummary> {
  const supabase = createClient()
  const from = startOfMonth(asOf).toISOString()
  const to = endOfMonth(asOf).toISOString()
  return useQuery({
    queryKey: ['month_summary', from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, performed_by, sharing')
        .is('deleted_at', null)
        .gte('performed_at', from)
        .lte('performed_at', to)
      if (error) throw error
      const rows = (data ?? []) as Row[]

      const summary: MonthSummary = {
        expenses: 0,
        income: 0,
        count: rows.length,
        sharedExpenses: 0,
        personalExpenses: 0,
        sharedExpensesByPerson: {},
      }

      for (const r of rows) {
        const amount = Number(r.amount)
        if (r.type === 'income') {
          summary.income += amount
        } else if (r.type === 'expense') {
          summary.expenses += amount
          if (r.sharing === 'shared') {
            summary.sharedExpenses += amount
            if (r.performed_by) {
              summary.sharedExpensesByPerson[r.performed_by] =
                (summary.sharedExpensesByPerson[r.performed_by] ?? 0) + amount
            }
          } else {
            summary.personalExpenses += amount
          }
        }
        // transfer y credit_payment se ignoran para el resumen.
      }
      return summary
    },
    staleTime: 30 * 1000,
  })
}
