'use client'

import { useState } from 'react'
import {
  addMonths,
  format,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button } from '@/components/ui/button'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { DayEvents } from '@/components/calendar/day-events'
import { ReminderFormDialog } from '@/components/reminders/reminder-form-dialog'
import { useCalendarEvents } from '@/hooks/use-calendar-events'
import { useHousehold } from '@/hooks/use-household'

export default function CalendarioPage() {
  const today = new Date()
  const [monthDate, setMonthDate] = useState(() => startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [reminderOpen, setReminderOpen] = useState(false)
  const { byDay, isLoading } = useCalendarEvents(monthDate)
  const { data: household } = useHousehold()
  const currency = household?.currency ?? 'MXN'

  const dayKey = format(selectedDate, 'yyyy-MM-dd')
  const dayEvents = byDay.get(dayKey) ?? []
  const monthLabel = format(monthDate, "MMMM 'de' yyyy", { locale: es })

  function goPrev() {
    const next = subMonths(monthDate, 1)
    setMonthDate(next)
    setSelectedDate(startOfMonth(next))
  }
  function goNext() {
    const next = addMonths(monthDate, 1)
    setMonthDate(next)
    setSelectedDate(startOfMonth(next))
  }
  function goToday() {
    const t = new Date()
    setMonthDate(startOfMonth(t))
    setSelectedDate(t)
  }

  return (
    <PageWrapper
      title="Calendario"
      description="Pagos recurrentes, recordatorios y movimientos del mes"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-44 text-center text-lg font-semibold capitalize">
            {monthLabel}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={goNext}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Button variant="ghost" size="sm" onClick={goToday}>
            Hoy
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <CalendarGrid
          monthDate={monthDate}
          byDay={byDay}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <DayEvents
          date={selectedDate}
          events={dayEvents}
          currency={currency}
          onAddReminder={() => setReminderOpen(true)}
        />
      </div>

      <Legend />

      <ReminderFormDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        defaultDate={dayKey}
      />
    </PageWrapper>
  )
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
      <LegendItem color="#E05A5A" label="Gasto recurrente" />
      <LegendItem color="#27AE60" label="Ingreso recurrente" />
      <LegendItem color="#6C63FF" label="Pago de tarjeta" />
      <LegendItem color="#F4A823" label="Recordatorio" />
      <LegendItem color="#9CA3AF" label="Recordatorio completado" />
      <LegendItem color="#2D9CDB" label="Movimiento" />
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
