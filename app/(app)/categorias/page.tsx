'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Sparkles, Loader2 } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CategoryFormDialog } from '@/components/categories/category-form-dialog'
import {
  useCategories,
  useDeleteCategory,
  type Category,
} from '@/hooks/use-categories'
import { useSeedDefaultCategories } from '@/hooks/use-household'
import { getCategoryIcon } from '@/lib/transactions'

export default function CategoriasPage() {
  const { data: categories, isLoading } = useCategories()
  const remove = useDeleteCategory()
  const seed = useSeedDefaultCategories()
  const [editing, setEditing] = useState<Category | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const expenses = (categories ?? []).filter((c) => c.kind === 'expense')
  const incomes = (categories ?? []).filter((c) => c.kind === 'income')

  function handleEdit(cat: Category) {
    setEditing(cat)
    setOpen(true)
  }
  function handleNew() {
    setEditing(undefined)
    setOpen(true)
  }

  async function handleDelete(cat: Category) {
    if (
      !confirm(
        `¿Eliminar "${cat.name}"? Los movimientos existentes quedan sin categoría.`
      )
    )
      return
    setDeleting(cat.id)
    try {
      await remove.mutateAsync(cat.id)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <PageWrapper
      title="Categorías"
      description="Organiza tus gastos e ingresos"
      actions={
        <div className="flex gap-2">
          {(categories?.length ?? 0) === 0 && (
            <Button
              variant="outline"
              onClick={() => seed.mutate()}
              disabled={seed.isPending}
            >
              {seed.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Sugeridas
            </Button>
          )}
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      ) : (categories?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center">
          <h2 className="text-lg font-semibold">Sin categorías aún</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Carga las sugeridas o crea las tuyas.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => seed.mutate()}
              disabled={seed.isPending}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Cargar sugeridas
            </Button>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <CategorySection
            label="Gastos"
            categories={expenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleting={deleting}
          />
          <CategorySection
            label="Ingresos"
            categories={incomes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleting={deleting}
          />
        </div>
      )}

      <CategoryFormDialog
        open={open}
        onOpenChange={setOpen}
        category={editing}
      />
    </PageWrapper>
  )
}

interface SectionProps {
  label: string
  categories: Category[]
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
  deleting: string | null
}

function CategorySection({
  label,
  categories,
  onEdit,
  onDelete,
  deleting,
}: SectionProps) {
  if (categories.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      <ul className="space-y-2">
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.icon)
          return (
            <li
              key={cat.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: cat.color }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="flex-1 truncate font-medium">{cat.name}</p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Editar"
                onClick={() => onEdit(cat)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Eliminar"
                onClick={() => onDelete(cat)}
                disabled={deleting === cat.id}
              >
                {deleting === cat.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
