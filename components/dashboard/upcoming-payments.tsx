'use client'

import Link from 'next/link'
import { addDays, format, isToday, isTomorrow, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, ChevronRight, Calendar } from 'lucide-react'
import { useRecurringRules } from '@/hooks/use-recurring-rules'
import { useAccounts } from '@/hooks/use-accounts'
import { TRANSACTION_TYPE_META } from '@/lib/transactions'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

const WINDOW_DAYS = 7

function formatDueLabel(date: Date): string {
  if (isToday(date)) return 'Hoy'
  if (isTomorrow(date)) return 'Mañana'
  return format(date, "EEE d 'de' MMM", { locale: es })
}

export interface UpcomingPaymentsProps {
  className?: string
  currency?: string
}

/**
 * Próximos pagos recurrentes en una ventana de 7 días desde hoy.
 * Se muestran sólo los gastos y pagos de tarjeta — los ingresos
 * recurrentes (sueldos) viven en otra sección.
 */
export function UpcomingPayments({
  className,
  currency = 'MXN',
}: UpcomingPaymentsProps) {
  const { data: rules, isLoading } = useRecurringRules()
  const { data: accounts } = useAccounts()

  if (isLoading) {
    return <Skeleton className={cn('h-44 w-full rounded-xl', className)} />
  }

  const today = startOfDay(new Date())
  const horizon = addDays(today, WINDOW_DAYS)

  const accountById = new Map(
    (accounts ?? []).map((a) => [a.id, a] as const)
  )

  const items = (rules ?? [])
    .filter((r) => r.type === 'expense' || r.type === 'credit_payment')
    .map((r) => ({ rule: r, due: startOfDay(new Date(r.next_run_date)) }))
    .filter(({ due }) => due >= today && due <= horizon)
    .sort((a, b) => a.due.getTime() - b.due.getTime())

  const total = items.reduce(
    (sum, { rule }) => sum + Number(rule.amount),
    0
  )

  return (
    <section
      className={cn(
        'rounded-xl border bg-card p-5 text-card-foreground',
        className
      )}
    >
      <div className="mb-4 flex items-baseline justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Bell className="h-3.5 w-3.5" />
          Próximos {WINDOW_DAYS} días
        </div>
        {items.length > 0 && (
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(total, currency)}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <Calendar className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sin pagos recurrentes próximos
          </p>
          <Link
            href="/recurrentes"
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            Crear uno →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 6).map(({ rule, due }) => {
            const meta = TRANSACTION_TYPE_META[rule.type]
            const Icon = meta.icon
            const account = accountById.get(rule.account_id)
            return (
              <li
                key={rule.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDueLabel(due)}
                    {account && <> · {account.name}</>}
                  </p>
                </div>
                <p className="tabular-nums text-sm font-semibold">
                  {formatCurrency(Number(rule.amount), rule.currency)}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      {items.length > 6 && (
        <Link
          href="/calendario"
          className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ver los {items.length - 6} restantes <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </section>
  )
}
