'use client'

import { useEffect, useState } from 'react'
import { format, startOfMonth } from 'date-fns'
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
import { useCategories } from '@/hooks/use-categories'
import { useUpsertBudget, type Budget } from '@/hooks/use-budgets'

export interface BudgetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Mes objetivo (start of month). */
  monthDate: Date
  /** Si se pasa, edita ese presupuesto (preselecciona categoría y monto). */
  existing?: Budget
  /** Categorías que ya tienen presupuesto este mes — se ocultan al crear. */
  takenCategoryIds?: string[]
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  monthDate,
  existing,
  takenCategoryIds = [],
}: BudgetFormDialogProps) {
  const upsert = useUpsertBudget()
  const { data: categories } = useCategories()
  const isEdit = !!existing

  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (existing) {
      setCategoryId(existing.category_id)
      setAmount(String(existing.amount))
    } else {
      setCategoryId('')
      setAmount('')
    }
    setError(null)
  }, [open, existing])

  const expenseCategories = (categories ?? []).filter(
    (c) => c.kind === 'expense'
  )
  const availableCategories = isEdit
    ? expenseCategories
    : expenseCategories.filter((c) => !takenCategoryIds.includes(c.id))

  async function handleSave() {
    setError(null)
    if (!categoryId) return setError('Selecciona una categoría')
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0)
      return setError('Monto inválido')
    try {
      await upsert.mutateAsync({
        category_id: categoryId,
        amount: amt,
        period_start: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-2">
          <div className="space-y-1.5">
            <Label htmlFor="b-cat">Categoría</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isEdit}
            >
              <SelectTrigger id="b-cat">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    Sin categorías disponibles
                  </SelectItem>
                ) : (
                  availableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Para cambiar la categoría, elimina este presupuesto y crea otro.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-amount">Límite mensual</Label>
            <Input
              id="b-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.currentTarget.value)}
              placeholder="0.00"
            />
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
            disabled={upsert.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEdit ? 'Guardar cambios' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
