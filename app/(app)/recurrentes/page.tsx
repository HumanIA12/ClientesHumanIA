'use client'

import { useState } from 'react'
import { format, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus,
  Pencil,
  Trash2,
  PlayCircle,
  Pause,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useRecurringRules,
  type RecurringRule,
} from '@/hooks/use-recurring-rules'
import {
  useDeleteRecurring,
  useMaterializeDueRecurrences,
  useUpdateRecurring,
} from '@/hooks/use-recurring-mutations'
import { useAccounts } from '@/hooks/use-accounts'
import { TRANSACTION_TYPE_META } from '@/lib/transactions'
import { formatCurrency } from '@/lib/utils/currency'
import { RecurringFormDialog } from '@/components/recurring/recurring-form-dialog'
import { cn } from '@/lib/utils/cn'

const FREQ_LABEL: Record<RecurringRule['frequency'], string> = {
  daily: 'diario',
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
  yearly: 'anual',
}

export default function RecurrentesPage() {
  const { data: rules, isLoading } = useRecurringRules({ activeOnly: false })
  const { data: accounts } = useAccounts()
  const remove = useDeleteRecurring()
  const update = useUpdateRecurring()
  const materialize = useMaterializeDueRecurrences()
  const [editing, setEditing] = useState<RecurringRule | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [materializeMsg, setMaterializeMsg] = useState<string | null>(null)

  const today = startOfDay(new Date())
  const dueCount =
    (rules ?? []).filter((r) =>
      isBefore(startOfDay(new Date(r.next_run_date)), today) ||
      startOfDay(new Date(r.next_run_date)).getTime() === today.getTime()
    ).length

  function handleNew() {
    setEditing(undefined)
    setOpen(true)
  }
  function handleEdit(r: RecurringRule) {
    setEditing(r)
    setOpen(true)
  }
  async function handleDelete(r: RecurringRule) {
    if (!confirm(`¿Eliminar "${r.name}"? Las transacciones generadas no se borran.`))
      return
    setBusyId(r.id)
    try {
      await remove.mutateAsync(r.id)
    } finally {
      setBusyId(null)
    }
  }
  async function handleToggle(r: RecurringRule) {
    setBusyId(r.id)
    try {
      await update.mutateAsync({
        id: r.id,
        patch: { is_active: !r.is_active },
      })
    } finally {
      setBusyId(null)
    }
  }
  async function handleMaterialize() {
    setMaterializeMsg(null)
    try {
      const inserted = await materialize.mutateAsync()
      setMaterializeMsg(
        inserted === 0
          ? 'No hay reglas vencidas pendientes.'
          : `Se generaron ${inserted} movimiento(s).`
      )
    } catch (err) {
      setMaterializeMsg(
        err instanceof Error ? err.message : 'Error al materializar'
      )
    }
  }

  const accountById = new Map((accounts ?? []).map((a) => [a.id, a] as const))

  return (
    <PageWrapper
      title="Recurrentes"
      description="Pagos automáticos y suscripciones"
      actions={
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva
        </Button>
      }
    >
      <div className="mb-4 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                dueCount > 0 ? 'text-accent' : 'text-muted-foreground'
              )}
            />
            <div>
              <p className="text-sm font-medium">
                {dueCount > 0
                  ? `${dueCount} regla(s) lista(s) para aplicarse`
                  : 'Todo al día'}
              </p>
              <p className="text-xs text-muted-foreground">
                Aplicar genera las transacciones derivadas y avanza la próxima
                fecha.
              </p>
            </div>
          </div>
          <Button
            onClick={handleMaterialize}
            disabled={materialize.isPending || dueCount === 0}
          >
            {materialize.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            Aplicar pendientes
          </Button>
        </div>
        {materializeMsg && (
          <p className="mt-2 text-xs text-muted-foreground">
            {materializeMsg}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ) : (rules?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center">
          <h2 className="text-lg font-semibold">Sin reglas todavía</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra los pagos que se repiten cada mes y NEXO los aplicará por ti.
          </p>
          <Button onClick={handleNew} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Nueva regla
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {rules!.map((r) => {
            const meta = TRANSACTION_TYPE_META[r.type]
            const Icon = meta.icon
            const account = accountById.get(r.account_id)
            const next = startOfDay(new Date(r.next_run_date))
            const isDue =
              next.getTime() <= today.getTime() && r.is_active
            return (
              <li
                key={r.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border bg-card p-3',
                  !r.is_active && 'opacity-60'
                )}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{r.name}</p>
                    {!r.is_active && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Pausada
                      </span>
                    )}
                    {isDue && (
                      <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        Vencida
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {FREQ_LABEL[r.frequency]} · próxima{' '}
                    {format(next, "d 'de' MMM", { locale: es })}
                    {account && <> · {account.name}</>}
                  </p>
                </div>
                <p className="tabular-nums text-sm font-semibold">
                  {formatCurrency(Number(r.amount), r.currency)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={r.is_active ? 'Pausar' : 'Reanudar'}
                  onClick={() => handleToggle(r)}
                  disabled={busyId === r.id}
                >
                  {busyId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : r.is_active ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Editar"
                  onClick={() => handleEdit(r)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar"
                  onClick={() => handleDelete(r)}
                  disabled={busyId === r.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <RecurringFormDialog open={open} onOpenChange={setOpen} rule={editing} />
    </PageWrapper>
  )
}
