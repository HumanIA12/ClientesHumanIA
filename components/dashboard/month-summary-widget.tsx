'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useMonthSummary } from '@/hooks/use-month-summary'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

export interface MonthSummaryWidgetProps {
  currency?: string
  className?: string
}

export function MonthSummaryWidget({
  currency = 'MXN',
  className,
}: MonthSummaryWidgetProps) {
  const { data, isLoading } = useMonthSummary()
  const monthName = format(new Date(), "MMMM 'de' yyyy", { locale: es })

  if (isLoading || !data) {
    return <Skeleton className={cn('h-44 w-full rounded-xl', className)} />
  }

  const balance = data.income - data.expenses
  const positive = balance >= 0

  return (
    <section
      className={cn(
        'rounded-xl border bg-card p-5 text-card-foreground',
        className
      )}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {monthName}
        </p>
        <p
          className={cn(
            'text-sm font-semibold tabular-nums',
            positive ? 'text-success' : 'text-danger'
          )}
        >
          {positive ? '+' : '−'}
          {formatCurrency(Math.abs(balance), currency)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-success/10 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-success">
            <TrendingUp className="h-3.5 w-3.5" />
            Ingresos
          </div>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {formatCurrency(data.income, currency)}
          </p>
        </div>
        <div className="rounded-lg bg-danger/10 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-danger">
            <TrendingDown className="h-3.5 w-3.5" />
            Gastos
          </div>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {formatCurrency(data.expenses, currency)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Compartido {formatCurrency(data.sharedExpenses, currency)} · Personal{' '}
        {formatCurrency(data.personalExpenses, currency)}
      </p>
    </section>
  )
}
