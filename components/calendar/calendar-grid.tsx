'use client'

import { useMemo } from 'react'
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import type { CalendarEvent } from '@/hooks/use-calendar-events'

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export interface CalendarGridProps {
  monthDate: Date
  byDay: Map<string, CalendarEvent[]>
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
}

/**
 * Grid mensual estilo agenda. Empieza la semana en lunes (locale es).
 * Cada celda muestra hasta 3 chips por día con el color del evento;
 * si hay más, agrega "+N". Las celdas son botones para abrir la
 * lista del día.
 */
export function CalendarGrid({
  monthDate,
  byDay,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [monthDate])

  return (
    <div className="rounded-xl border bg-card p-2 sm:p-3">
      <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd')
          const events = byDay.get(key) ?? []
          const inMonth = isSameMonth(d, monthDate)
          const today = isToday(d)
          const selected = selectedDate
            ? isSameDay(d, selectedDate)
            : false

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(d)}
              aria-label={format(d, "d 'de' MMMM", { locale: es })}
              aria-pressed={selected}
              className={cn(
                'relative flex aspect-square min-h-12 flex-col items-stretch overflow-hidden rounded-md border p-1 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                inMonth ? 'bg-card' : 'bg-muted/30',
                selected && 'border-primary ring-2 ring-primary/30',
                !selected && 'hover:bg-muted'
              )}
            >
              <div className="flex items-center justify-between px-0.5 pt-0.5">
                <span
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold',
                    today
                      ? 'bg-primary text-primary-foreground'
                      : inMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  )}
                >
                  {format(d, 'd')}
                </span>
                {events.length > 0 && inMonth && (
                  <span className="rounded-full bg-muted px-1 text-[9px] font-bold tabular-nums">
                    {events.length}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-0.5 px-0.5">
                {events.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    title={ev.title}
                    className="block h-1 w-1 rounded-full"
                    style={{ backgroundColor: ev.color }}
                  />
                ))}
                {events.length > 3 && (
                  <span className="text-[8px] font-semibold leading-none text-muted-foreground">
                    +{events.length - 3}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
