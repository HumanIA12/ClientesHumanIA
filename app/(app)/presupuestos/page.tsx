'use client'

import { useMemo, useState } from 'react'
import {
  addMonths,
  format,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Target } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useBudgetsWithProgress,
  useDeleteBudget,
  type BudgetProgress,
} from '@/hooks/use-budgets'
import { useCategories } from '@/hooks/use-categories'
import { useHousehold } from '@/hooks/use-household'
import { formatCurrency } from '@/lib/utils/currency'
import { BudgetFormDialog } from '@/components/budgets/budget-form-dialog'
import { BudgetRow } from '@/components/budgets/budget-row'
import type { Budget } from '@/hooks/use-budgets'

export default function PresupuestosPage() {
  const today = new Date()
  const [monthDate, setMonthDate] = useState(() => startOfMonth(today))
  const { data: progress, isLoading } = useBudgetsWithProgress(monthDate)
  const { data: categories } = useCategories()
  const { data: household } = useHousehold()
  const remove = useDeleteBudget()
  const [editing, setEditing] = useState<Budget | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const currency = household?.currency ?? 'MXN'

  const monthLabel = format(monthDate, "MMMM 'de' yyyy", { locale: es })

  const totals = useMemo(() => {
    const list = progress ?? []
    return {
      target: list.reduce((s, p) => s + Number(p.budget.amount), 0),
      spent: list.reduce((s, p) => s + p.spent, 0),
    }
  }, [progress])

  const overallPct =
    totals.target > 0 ? (totals.spent / totals.target) * 100 : 0

  const categoryById = new Map(
    (categories ?? []).map((c) => [c.id, c] as const)
  )
  const takenCategoryIds = (progress ?? []).map((p) => p.budget.category_id)

  function handleNew() {
    setEditing(undefined)
    setOpen(true)
  }
  function handleEdit(p: BudgetProgress) {
    setEditing(p.budget)
    setOpen(true)
  }
  async function handleDelete(p: BudgetProgress) {
    if (
      !confirm(
        `¿Eliminar el presupuesto de "${categoryById.get(p.budget.category_id)?.name ?? 'esta categoría'}"?`
      )
    )
      return
    setBusyId(p.budget.id)
    try {
      await remove.mutateAsync(p.budget.id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageWrapper
      title="Presupuestos"
      description="Límites mensuales por categoría"
      actions={
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonthDate((d) => subMonths(d, 1))}
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
            onClick={() => setMonthDate((d) => addMonths(d, 1))}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMonthDate(startOfMonth(new Date()))}
        >
          Hoy
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : (progress?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center">
          <Target className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            Sin presupuestos en {monthLabel}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Asigna un límite a tus categorías de gasto y vigila el progreso del
            mes.
          </p>
          <Button onClick={handleNew} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo presupuesto
          </Button>
        </div>
      ) : (
        <>
          <section className="mb-4 rounded-xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total del mes
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatCurrency(totals.spent, currency)}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                de {formatCurrency(totals.target, currency)}
              </span>
            </p>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
              aria-hidden
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(overallPct, 100)}%`,
                  backgroundColor:
                    overallPct > 100
                      ? '#E05A5A'
                      : overallPct >= 80
                        ? '#F4A823'
                        : '#27AE60',
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {overallPct.toFixed(0)}% del total presupuestado
            </p>
          </section>

          <ul className="space-y-2">
            {progress!.map((p) => (
              <BudgetRow
                key={p.budget.id}
                progress={p}
                category={categoryById.get(p.budget.category_id)}
                currency={currency}
                onEdit={() => handleEdit(p)}
                onDelete={() => handleDelete(p)}
                busy={busyId === p.budget.id}
              />
            ))}
          </ul>
        </>
      )}

      <BudgetFormDialog
        open={open}
        onOpenChange={setOpen}
        monthDate={monthDate}
        existing={editing}
        takenCategoryIds={takenCategoryIds}
      />
    </PageWrapper>
  )
}
