'use client'

import { useMemo } from 'react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useExpenseByCategory } from '@/hooks/use-report-data'
import { useCategories } from '@/hooks/use-categories'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartDatum {
  name: string
  value: number
  color: string
}

export function ExpensesPie({ currency = 'MXN' }: { currency?: string }) {
  const { data: items, isLoading } = useExpenseByCategory()
  const { data: categories } = useCategories()

  const chartData = useMemo<ChartDatum[]>(() => {
    if (!items || !categories) return []
    return items.map((it) => {
      const cat = it.categoryId
        ? categories.find((c) => c.id === it.categoryId)
        : undefined
      return {
        name: cat?.name ?? 'Sin categoría',
        value: it.total,
        color: cat?.color ?? '#9CA3AF',
      }
    })
  }, [items, categories])

  const total = chartData.reduce((s, d) => s + d.value, 0)

  if (isLoading) return <Skeleton className="h-72 w-full rounded-xl" />

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed bg-card/40 text-sm text-muted-foreground">
        Sin gastos registrados este mes.
      </div>
    )
  }

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_220px]">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            >
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currency)}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--popover))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1.5 text-sm">
        {chartData.slice(0, 8).map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
