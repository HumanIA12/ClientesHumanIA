'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarPlus, Bell, Repeat, Receipt } from 'lucide-react'
import type { CalendarEvent } from '@/hooks/use-calendar-events'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/currency'

const KIND_META: Record<
  CalendarEvent['kind'],
  { label: string; icon: typeof Bell }
> = {
  recurring: { label: 'Recurrente', icon: Repeat },
  reminder: { label: 'Recordatorio', icon: Bell },
  transaction: { label: 'Movimiento', icon: Receipt },
}

export interface DayEventsProps {
  date: Date
  events: CalendarEvent[]
  currency?: string
  onAddReminder: () => void
}

export function DayEvents({
  date,
  events,
  currency = 'MXN',
  onAddReminder,
}: DayEventsProps) {
  const sorted = [...events].sort((a, b) => {
    const order = { recurring: 0, reminder: 1, transaction: 2 } as const
    return order[a.kind] - order[b.kind] || a.title.localeCompare(b.title)
  })

  const totalProjected = sorted.reduce((sum, e) => {
    if (e.amount === null) return sum
    if (e.kind === 'recurring' && e.type === 'income') return sum
    if (e.kind === 'transaction' && e.type !== 'expense') return sum
    return sum + e.amount
  }, 0)

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold capitalize">
          {format(date, "EEEE d 'de' MMMM", { locale: es })}
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddReminder}
          aria-label="Añadir recordatorio en este día"
        >
          <CalendarPlus className="mr-1.5 h-3.5 w-3.5" />
          Recordatorio
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Sin eventos este día.
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {sorted.map((ev) => {
              const Icon = KIND_META[ev.kind].icon
              const href =
                ev.kind === 'transaction'
                  ? `/movimientos/${ev.entityId}`
                  : ev.kind === 'recurring'
                    ? `/recurrentes`
                    : `/recordatorios`
              return (
                <li
                  key={ev.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: ev.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={href}
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {ev.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {KIND_META[ev.kind].label}
                      {ev.completed && ' · completado'}
                    </p>
                  </div>
                  {ev.amount !== null && (
                    <p className="tabular-nums text-sm font-semibold">
                      {formatCurrency(ev.amount, currency)}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
          {totalProjected > 0 && (
            <p className="mt-3 text-right text-xs text-muted-foreground">
              Total estimado de salidas:{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(totalProjected, currency)}
              </span>
            </p>
          )}
        </>
      )}
    </div>
  )
}
