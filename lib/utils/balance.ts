import {
  endOfMonth,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
} from 'date-fns'
import type { Tables } from '@/lib/types/database'

type Account = Tables<'accounts'>
type RecurringRule = Tables<'recurring_rules'>

/**
 * Cuentas líquidas (excluye crédito y préstamos): suma de saldos disponibles
 * que la pareja puede gastar hoy. Las tarjetas de crédito y préstamos no
 * cuentan porque su balance representa deuda, no efectivo disponible.
 */
export function calculateLiquidBalance(accounts: Account[]): number {
  return accounts
    .filter(
      (a) =>
        !a.is_archived &&
        a.deleted_at === null &&
        a.type !== 'credit_card' &&
        a.type !== 'loan'
    )
    .reduce((sum, a) => sum + Number(a.current_balance), 0)
}

/**
 * Total adeudado en tarjetas de crédito (balance suele ser negativo o
 * representar deuda). Devuelve un número positivo: lo que se debe.
 */
export function calculateCreditDebt(accounts: Account[]): number {
  return accounts
    .filter(
      (a) =>
        !a.is_archived && a.deleted_at === null && a.type === 'credit_card'
    )
    .reduce((sum, a) => sum + Math.abs(Number(a.current_balance)), 0)
}

/**
 * Suma los pagos recurrentes (gastos) cuyo next_run_date cae entre `from`
 * (incl) y `to` (incl). Sólo considera reglas activas no eliminadas y
 * gastos / pagos de tarjeta — los ingresos no restan disponible.
 */
export function sumUpcomingRecurringExpenses(
  rules: RecurringRule[],
  from: Date,
  to: Date
): number {
  const fromStart = startOfDay(from)
  const toStart = startOfDay(to)
  return rules
    .filter(
      (r) =>
        r.is_active &&
        r.deleted_at === null &&
        (r.type === 'expense' || r.type === 'credit_payment')
    )
    .filter((r) => {
      const next = startOfDay(new Date(r.next_run_date))
      const afterOrEqualFrom =
        isAfter(next, fromStart) || isSameDay(next, fromStart)
      const beforeOrEqualTo =
        isBefore(next, toStart) || isSameDay(next, toStart)
      return afterOrEqualFrom && beforeOrEqualTo
    })
    .reduce((sum, r) => sum + Number(r.amount), 0)
}

export interface SafeAvailableInput {
  accounts: Account[]
  recurringRules: RecurringRule[]
  /** Colchón mínimo configurado por el usuario (default 0). */
  buffer?: number
  /** Fecha de referencia, default = hoy. */
  asOf?: Date
}

/**
 * Disponible Seguro = saldo líquido − pagos recurrentes futuros del mes − colchón.
 *
 * Es lo que la pareja puede gastar hoy sin comprometer compromisos del mes
 * en curso (tarjetas, renta, suscripciones recurrentes que aún no se han
 * cobrado). Nunca devuelve menos que cero porque, conceptualmente, el
 * disponible seguro no puede ser negativo (si lo es, hay un déficit que se
 * representa por separado).
 */
export function calculateSafeAvailable({
  accounts,
  recurringRules,
  buffer = 0,
  asOf = new Date(),
}: SafeAvailableInput): number {
  const liquid = calculateLiquidBalance(accounts)
  const upcoming = sumUpcomingRecurringExpenses(
    recurringRules,
    asOf,
    endOfMonth(asOf)
  )
  const result = liquid - upcoming - buffer
  return Math.max(0, result)
}

/**
 * Variante que devuelve el desglose para mostrar en UI.
 */
export function calculateSafeAvailableBreakdown(input: SafeAvailableInput) {
  const liquid = calculateLiquidBalance(input.accounts)
  const upcoming = sumUpcomingRecurringExpenses(
    input.recurringRules,
    input.asOf ?? new Date(),
    endOfMonth(input.asOf ?? new Date())
  )
  const buffer = input.buffer ?? 0
  const safe = Math.max(0, liquid - upcoming - buffer)
  return { liquid, upcoming, buffer, safe }
}
