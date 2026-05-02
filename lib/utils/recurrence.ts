import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
} from 'date-fns'
import type { RecurrenceFrequency } from '@/lib/types/database'

function step(freq: RecurrenceFrequency, from: Date): Date {
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

export interface RecurrenceWindow {
  start_date: string
  end_date: string | null
  next_run_date: string
  frequency: RecurrenceFrequency
}

/**
 * Expande una regla recurrente a la lista de fechas en las que caerá
 * dentro del rango [from, to] (inclusivo).
 *
 * Usa next_run_date como ancla (es la próxima ocurrencia conocida).
 * Si la regla tiene end_date, no devuelve fechas posteriores. El
 * límite de iteraciones es defensivo: nunca debería superar ~366
 * para un mes con frecuencia diaria.
 */
export function expandRecurrenceInRange(
  rule: RecurrenceWindow,
  from: Date,
  to: Date
): Date[] {
  const result: Date[] = []
  const fromDay = startOfDay(from)
  const toDay = startOfDay(to)
  const endLimit = rule.end_date ? startOfDay(new Date(rule.end_date)) : null

  let current = startOfDay(new Date(rule.next_run_date))

  // Avanzar mientras current < from (saltar ocurrencias previas al rango).
  let safety = 0
  while (isBefore(current, fromDay) && safety < 1000) {
    current = step(rule.frequency, current)
    safety++
  }

  // Acumular ocurrencias hasta pasar el rango (o end_date).
  safety = 0
  while (
    (isBefore(current, toDay) || isSameDay(current, toDay)) &&
    safety < 1000
  ) {
    if (endLimit && isAfter(current, endLimit)) break
    result.push(current)
    current = step(rule.frequency, current)
    safety++
  }

  return result
}
