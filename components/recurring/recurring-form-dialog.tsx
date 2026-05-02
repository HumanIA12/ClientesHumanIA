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
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useHouseholdMembers } from '@/hooks/use-household-members'
import {
  useCreateRecurring,
  useUpdateRecurring,
} from '@/hooks/use-recurring-mutations'
import type { RecurringRule } from '@/hooks/use-recurring-rules'
import type {
  RecurrenceFrequency,
  Sharing,
  TransactionType,
} from '@/lib/types/database'
import { TRANSACTION_TYPE_META } from '@/lib/transactions'

const FREQUENCIES: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export interface RecurringFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule?: RecurringRule
}

export function RecurringFormDialog({
  open,
  onOpenChange,
  rule,
}: RecurringFormDialogProps) {
  const create = useCreateRecurring()
  const update = useUpdateRecurring()
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const { data: members } = useHouseholdMembers()
  const isEdit = !!rule

  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('0')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState<string>('')
  const [performedBy, setPerformedBy] = useState<string | null>(null)
  const [sharing, setSharing] = useState<Sharing>('shared')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (rule) {
      setName(rule.name)
      setType(rule.type)
      setAmount(String(rule.amount))
      setAccountId(rule.account_id)
      setCategoryId(rule.category_id)
      setFrequency(rule.frequency)
      setStartDate(rule.start_date)
      setEndDate(rule.end_date ?? '')
      setPerformedBy(rule.performed_by)
      setSharing(rule.sharing)
    } else {
      setName('')
      setType('expense')
      setAmount('0')
      setAccountId('')
      setCategoryId(null)
      setFrequency('monthly')
      setStartDate(todayISO())
      setEndDate('')
      setPerformedBy(null)
      setSharing('shared')
    }
    setError(null)
  }, [open, rule])

  const liveAccounts = (accounts ?? []).filter(
    (a) => !a.is_archived && a.deleted_at === null
  )
  const filteredCategories = (categories ?? []).filter(
    (c) => c.kind === type
  )

  async function handleSave() {
    setError(null)
    if (!name.trim()) return setError('El nombre es obligatorio')
    if (!accountId) return setError('Selecciona una cuenta')
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) return setError('Monto inválido')
    if (type === 'expense' && !categoryId)
      return setError('Selecciona una categoría')

    try {
      if (isEdit && rule) {
        await update.mutateAsync({
          id: rule.id,
          patch: {
            name: name.trim(),
            type,
            amount: amt,
            account_id: accountId,
            category_id: categoryId,
            frequency,
            start_date: startDate,
            end_date: endDate || null,
            performed_by: performedBy,
            sharing,
          },
        })
      } else {
        await create.mutateAsync({
          name: name.trim(),
          type,
          amount: amt,
          account_id: accountId,
          category_id: categoryId,
          frequency,
          start_date: startDate,
          end_date: endDate || null,
          next_run_date: startDate,
          performed_by: performedBy,
          sharing,
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  const submitting = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar' : 'Nueva'} regla recurrente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-2">
          <div className="space-y-1.5">
            <Label htmlFor="r-name">Nombre</Label>
            <Input
              id="r-name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Renta, Netflix, Sueldo…"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="r-type">Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as TransactionType)
                  setCategoryId(null)
                }}
              >
                <SelectTrigger id="r-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">
                    {TRANSACTION_TYPE_META.expense.label}
                  </SelectItem>
                  <SelectItem value="income">
                    {TRANSACTION_TYPE_META.income.label}
                  </SelectItem>
                  <SelectItem value="credit_payment">
                    {TRANSACTION_TYPE_META.credit_payment.label}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-amount">Monto</Label>
              <Input
                id="r-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-account">Cuenta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="r-account">
                <SelectValue placeholder="Selecciona una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {liveAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(type === 'expense' || type === 'income') && (
            <div className="space-y-1.5">
              <Label htmlFor="r-category">Categoría</Label>
              <Select
                value={categoryId ?? ''}
                onValueChange={(v) => setCategoryId(v || null)}
              >
                <SelectTrigger id="r-category">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="r-freq">Frecuencia</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}
              >
                <SelectTrigger id="r-freq">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-start">Próxima fecha</Label>
              <Input
                id="r-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.currentTarget.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="r-end">Termina (opcional)</Label>
              <Input
                id="r-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.currentTarget.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-by">¿Quién lo paga?</Label>
              <Select
                value={performedBy ?? ''}
                onValueChange={(v) => setPerformedBy(v || null)}
              >
                <SelectTrigger id="r-by">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {(members ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Compartido / personal</Label>
            <Select
              value={sharing}
              onValueChange={(v) => setSharing(v as Sharing)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shared">Compartido</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>
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
            {isEdit ? 'Guardar cambios' : 'Crear regla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
