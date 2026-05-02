'use client'

import { Plus } from 'lucide-react'
import type { Category } from '@/hooks/use-categories'
import { getCategoryIcon } from '@/lib/transactions'
import { cn } from '@/lib/utils/cn'

export interface CategoryPickerProps {
  categories: Category[]
  value: string | null
  onChange: (id: string) => void
  /** Filtrar por kind (default 'expense'). */
  kind?: Category['kind']
  /** Acción opcional para crear una categoría nueva. */
  onCreate?: () => void
  className?: string
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  kind = 'expense',
  onCreate,
  className,
}: CategoryPickerProps) {
  const filtered = categories.filter((c) => c.kind === kind)

  if (filtered.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Aún no tienes categorías.
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="ml-2 font-medium text-primary hover:underline"
          >
            Crear la primera
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6',
        className
      )}
    >
      {filtered.map((cat) => {
        const Icon = getCategoryIcon(cat.icon)
        const selected = value === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            aria-pressed={selected}
            className={cn(
              'group flex flex-col items-center gap-1 rounded-lg border bg-card p-2 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              selected
                ? 'border-primary ring-2 ring-primary/30'
                : 'hover:border-foreground/20'
            )}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: cat.color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="line-clamp-2 text-center leading-tight">
              {cat.name}
            </span>
          </button>
        )
      })}
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="flex flex-col items-center gap-1 rounded-lg border border-dashed bg-card p-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed">
            <Plus className="h-5 w-5" />
          </span>
          <span>Nueva</span>
        </button>
      )}
    </div>
  )
}
