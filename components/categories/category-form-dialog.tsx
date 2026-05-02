'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CATEGORY_ICON_KEYS,
  CATEGORY_COLOR_PALETTE,
  getCategoryIcon,
} from '@/lib/transactions'
import {
  useCreateCategory,
  useUpdateCategory,
  type Category,
} from '@/hooks/use-categories'
import type { TransactionType } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

export interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si se pasa, edita esta categoría. */
  category?: Category
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const isEdit = !!category

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('package')
  const [color, setColor] = useState<string>(CATEGORY_COLOR_PALETTE[0])
  const [kind, setKind] = useState<TransactionType>('expense')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (category) {
      setName(category.name)
      setIcon(category.icon)
      setColor(category.color)
      setKind(category.kind)
    } else {
      setName('')
      setIcon('package')
      setColor(CATEGORY_COLOR_PALETTE[0])
      setKind('expense')
    }
    setError(null)
  }, [open, category])

  async function handleSave() {
    setError(null)
    if (!name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    try {
      if (isEdit && category) {
        await update.mutateAsync({
          id: category.id,
          patch: { name: name.trim(), icon, color, kind },
        })
      } else {
        await create.mutateAsync({
          name: name.trim(),
          icon,
          color,
          kind,
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  const PreviewIcon = getCategoryIcon(icon)
  const submitting = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-2">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              <PreviewIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {name || 'Vista previa'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {kind === 'expense' ? 'Gasto' : kind === 'income' ? 'Ingreso' : kind}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nombre</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Comida, Sueldo, Gasolina…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-kind">Tipo</Label>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as TransactionType)}
            >
              <SelectTrigger id="cat-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Gasto</SelectItem>
                <SelectItem value="income">Ingreso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_PALETTE.map((c) => {
                const selected = color.toLowerCase() === c.toLowerCase()
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    aria-pressed={selected}
                    className={cn(
                      'h-8 w-8 rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      selected && 'scale-110 ring-2 ring-foreground ring-offset-2'
                    )}
                    style={{ backgroundColor: c }}
                  />
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Icono</Label>
            <div className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-md border p-2 sm:grid-cols-8">
              {CATEGORY_ICON_KEYS.map((key) => {
                const Icon = getCategoryIcon(key)
                const selected = icon === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    aria-pressed={selected}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md border transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-danger/30 bg-danger/5 p-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
