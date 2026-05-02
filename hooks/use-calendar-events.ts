'use client'

import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRecurringRules } from '@/hooks/use-recurring-rules'
import { useReminders } from '@/hooks/use-reminders'
import { expandRecurrenceInRange } from '@/lib/utils/recurrence'
import type { TransactionType } from '@/lib/types/database'

export type CalendarEventKind = 'recurring' | 'reminder' | 'transaction'

export interface CalendarEvent {
  id: string
  kind: CalendarEventKind
  date: string // yyyy-MM-dd
  title: string
  amount: number | null
  /** Color para el chip — del tipo o de la categoría. */
  color: string
  /** Tipo si aplica (recurring o transaction). */
  type?: TransactionType
  /** ID de la entidad real para abrir su detalle. */
  entityId: string
  /** Si está completado (sólo recordatorios). */
  completed?: boolean
}

interface TransactionMini {
  id: string
  performed_at: string
  type: TransactionType
  amount: number
  description: string | null
  category_id: string | null
}

/**
 * Carga las transacciones reales del mes (ya hechas) para mostrarlas
 * en el calendario junto con las proyecciones (recurrentes futuras
 * y recordatorios). Trae sólo las columnas necesarias.
 */
function useMonthTransactions(monthDate: Date) {
  const supabase = createClient()
  const from = startOfMonth(monthDate).toISOString()
  const to = endOfMonth(monthDate).toISOString()
  return useQuery({
    queryKey: ['calendar', 'transactions', from, to],
    queryFn: async (): Promise<TransactionMini[]> => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, performed_at, type, amount, description, category_id')
        .is('deleted_at', null)
        .gte('performed_at', from)
        .lte('performed_at', to)
        .order('performed_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as TransactionMini[]
    },
    staleTime: 30 * 1000,
  })
}

export interface UseCalendarEventsResult {
  /** Map fecha (yyyy-MM-dd) → eventos de ese día. */
  byDay: Map<string, CalendarEvent[]>
  isLoading: boolean
}

/**
 * Consolida todo lo que cae en el mes que se está viendo:
 *  - Reglas recurrentes activas (proyectadas con expandRecurrenceInRange)
 *  - Recordatorios con due_date dentro del mes
 *  - Transacciones reales del mes
 *
 * Devuelve un Map indexado por yyyy-MM-dd para acceso O(1) desde
 * cada celda del calendario.
 */
export function useCalendarEvents(monthDate: Date): UseCalendarEventsResult {
  const { data: rules, isLoading: loadingRules } = useRecurringRules()
  const { data: reminders, isLoading: loadingReminders } = useReminders()
  const { data: transactions, isLoading: loadingTx } =
    useMonthTransactions(monthDate)

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    const from = startOfMonth(monthDate)
    const to = endOfMonth(monthDate)

    function push(ev: CalendarEvent) {
      const list = map.get(ev.date) ?? []
      list.push(ev)
      map.set(ev.date, list)
    }

    // Reglas recurrentes activas
    for (const r of rules ?? []) {
      const dates = expandRecurrenceInRange(
        {
          start_date: r.start_date,
          end_date: r.end_date,
          next_run_date: r.next_run_date,
          frequency: r.frequency,
        },
        from,
        to
      )
      for (const d of dates) {
        push({
          id: `r-${r.id}-${format(d, 'yyyyMMdd')}`,
          kind: 'recurring',
          date: format(d, 'yyyy-MM-dd'),
          title: r.name,
          amount: Number(r.amount),
          color:
            r.type === 'income'
              ? '#27AE60'
              : r.type === 'credit_payment'
                ? '#6C63FF'
                : '#E05A5A',
          type: r.type,
          entityId: r.id,
        })
      }
    }

    // Recordatorios del mes
    for (const r of reminders ?? []) {
      const due = new Date(r.due_date)
      if (due < from || due > to) continue
      push({
        id: `n-${r.id}`,
        kind: 'reminder',
        date: format(due, 'yyyy-MM-dd'),
        title: r.title,
        amount: r.amount ? Number(r.amount) : null,
        color: r.is_completed ? '#9CA3AF' : '#F4A823',
        entityId: r.id,
        completed: r.is_completed,
      })
    }

    // Transacciones reales
    for (const t of transactions ?? []) {
      push({
        id: `t-${t.id}`,
        kind: 'transaction',
        date: format(new Date(t.performed_at), 'yyyy-MM-dd'),
        title: t.description ?? '(sin descripción)',
        amount: Number(t.amount),
        color:
          t.type === 'income'
            ? '#27AE60'
            : t.type === 'expense'
              ? '#E05A5A'
              : '#2D9CDB',
        type: t.type,
        entityId: t.id,
      })
    }

    return map
  }, [rules, reminders, transactions, monthDate])

  return {
    byDay,
    isLoading: loadingRules || loadingReminders || loadingTx,
  }
}
