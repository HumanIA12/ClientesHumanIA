'use client'

import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BudgetProgress } from '@/hooks/use-budgets'
import type { Category } from '@/hooks/use-categories'
import { getCategoryIcon } from '@/lib/transactions'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'

export interface BudgetRowProps {
  progress: BudgetProgress
  category?: Category
  currency?: string
  onEdit: () => void
  onDelete: () => void
  busy?: boolean
}

/**
 * Fila de presupuesto con barra de progreso. Color del relleno según
 * el % gastado: verde < 80, ámbar 80-100, rojo > 100.
 */
export function BudgetRow({
  progress,
  category,
  currency = 'MXN',
  onEdit,
  onDelete,
  busy,
}: BudgetRowProps) {
  const Icon = getCategoryIcon(category?.icon ?? 'package')
  const pct = Math.min(progress.percent, 100)
  const overpct = Math.max(progress.percent - 100, 0)

  const fill =
    progress.percent > 100
      ? '#E05A5A'
      : progress.percent >= 80
        ? '#F4A823'
        : '#27AE60'

  const label = category?.name ?? 'Sin categoría'

  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: category?.color ?? '#9CA3AF' }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(progress.spent, currency)} de{' '}
            {formatCurrency(Number(progress.budget.amount), currency)}
          </p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              'text-sm font-semibold tabular-nums',
              progress.percent > 100
                ? 'text-danger'
                : progress.percent >= 80
                  ? 'text-accent'
                  : 'text-success'
            )}
          >
            {progress.percent.toFixed(0)}%
          </p>
          {progress.delta < 0 ? (
            <p className="text-xs text-muted-foreground">
              {formatCurrency(Math.abs(progress.delta), currency)} disponible
            </p>
          ) : progress.delta > 0 ? (
            <p className="text-xs text-danger">
              +{formatCurrency(progress.delta, currency)}
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar"
          onClick={onEdit}
          disabled={busy}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Eliminar"
          onClick={onDelete}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div
        className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
        aria-hidden
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: fill }}
        />
        {overpct > 0 && (
          <div
            className="absolute right-0 top-0 h-full rounded-full bg-danger/40"
            style={{ width: `${Math.min(overpct, 100)}%` }}
          />
        )}
      </div>
    </li>
  )
}
