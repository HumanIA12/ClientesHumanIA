'use client'

import { useState } from 'react'
import { format, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  Square,
  Loader2,
  Bell,
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useReminders,
  useUpdateReminder,
  useDeleteReminder,
  type Reminder,
} from '@/hooks/use-reminders'
import { useHousehold } from '@/hooks/use-household'
import { ReminderFormDialog } from '@/components/reminders/reminder-form-dialog'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'

export default function RecordatoriosPage() {
  const { data: reminders, isLoading } = useReminders()
  const { data: household } = useHousehold()
  const update = useUpdateReminder()
  const remove = useDeleteReminder()
  const [editing, setEditing] = useState<Reminder | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const currency = household?.currency ?? 'MXN'

  const today = startOfDay(new Date())
  const pending = (reminders ?? []).filter((r) => !r.is_completed)
  const completed = (reminders ?? []).filter((r) => r.is_completed)

  function handleNew() {
    setEditing(undefined)
    setOpen(true)
  }
  function handleEdit(r: Reminder) {
    setEditing(r)
    setOpen(true)
  }
  async function handleToggle(r: Reminder) {
    setBusy(r.id)
    try {
      await update.mutateAsync({
        id: r.id,
        patch: { is_completed: !r.is_completed },
      })
    } finally {
      setBusy(null)
    }
  }
  async function handleDelete(r: Reminder) {
    if (!confirm(`¿Eliminar el recordatorio "${r.title}"?`)) return
    setBusy(r.id)
    try {
      await remove.mutateAsync(r.id)
    } finally {
      setBusy(null)
    }
  }

  return (
    <PageWrapper
      title="Recordatorios"
      description="Vencimientos por revisar"
      actions={
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : (reminders?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center">
          <Bell className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Sin recordatorios</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Anota vencimientos puntuales como un predial o un seguro anual.
          </p>
          <Button onClick={handleNew} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <ReminderList
            label={`Pendientes (${pending.length})`}
            items={pending}
            today={today}
            currency={currency}
            busy={busy}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {completed.length > 0 && (
            <ReminderList
              label={`Completados (${completed.length})`}
              items={completed}
              today={today}
              currency={currency}
              busy={busy}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      <ReminderFormDialog
        open={open}
        onOpenChange={setOpen}
        reminder={editing}
      />
    </PageWrapper>
  )
}

interface ListProps {
  label: string
  items: Reminder[]
  today: Date
  currency: string
  busy: string | null
  onToggle: (r: Reminder) => void
  onEdit: (r: Reminder) => void
  onDelete: (r: Reminder) => void
}

function ReminderList({
  label,
  items,
  today,
  currency,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: ListProps) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      <ul className="space-y-2">
        {items.map((r) => {
          const due = startOfDay(new Date(r.due_date))
          const overdue = !r.is_completed && isBefore(due, today)
          return (
            <li
              key={r.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border bg-card p-3',
                r.is_completed && 'opacity-60'
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label={r.is_completed ? 'Marcar pendiente' : 'Marcar hecho'}
                onClick={() => onToggle(r)}
                disabled={busy === r.id}
              >
                {busy === r.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : r.is_completed ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'truncate font-medium',
                      r.is_completed && 'line-through'
                    )}
                  >
                    {r.title}
                  </p>
                  {overdue && (
                    <span className="rounded-full bg-danger/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
                      Vencido
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(due, "d 'de' MMMM yyyy", { locale: es })}
                </p>
              </div>
              {r.amount !== null && r.amount !== undefined && (
                <p className="tabular-nums text-sm font-semibold">
                  {formatCurrency(Number(r.amount), currency)}
                </p>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                onClick={() => onEdit(r)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Eliminar"
                onClick={() => onDelete(r)}
                disabled={busy === r.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
