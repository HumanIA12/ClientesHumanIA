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
  useCreateReminder,
  useUpdateReminder,
  type Reminder,
} from '@/hooks/use-reminders'
import { useAccounts } from '@/hooks/use-accounts'

const NO_ACCOUNT = '__none__'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export interface ReminderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reminder?: Reminder
  /** Fecha precargada cuando se crea desde un día concreto. */
  defaultDate?: string
}

export function ReminderFormDialog({
  open,
  onOpenChange,
  reminder,
  defaultDate,
}: ReminderFormDialogProps) {
  const create = useCreateReminder()
  const update = useUpdateReminder()
  const { data: accounts } = useAccounts()
  const isEdit = !!reminder

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(defaultDate ?? todayISO())
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (reminder) {
      setTitle(reminder.title)
      setDueDate(reminder.due_date)
      setAmount(reminder.amount ? String(reminder.amount) : '')
      setAccountId(reminder.account_id)
    } else {
      setTitle('')
      setDueDate(defaultDate ?? todayISO())
      setAmount('')
      setAccountId(null)
    }
    setError(null)
  }, [open, reminder, defaultDate])

  async function handleSave() {
    setError(null)
    if (!title.trim()) return setError('El título es obligatorio')
    const amt = amount ? Number(amount) : null
    if (amt !== null && (!Number.isFinite(amt) || amt < 0))
      return setError('Monto inválido')

    try {
      if (isEdit && reminder) {
        await update.mutateAsync({
          id: reminder.id,
          patch: {
            title: title.trim(),
            due_date: dueDate,
            amount: amt,
            account_id: accountId,
          },
        })
      } else {
        await create.mutateAsync({
          title: title.trim(),
          due_date: dueDate,
          amount: amt,
          account_id: accountId,
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  const submitting = create.isPending || update.isPending
  const liveAccounts = (accounts ?? []).filter(
    (a) => !a.is_archived && a.deleted_at === null
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar recordatorio' : 'Nuevo recordatorio'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-2">
          <div className="space-y-1.5">
            <Label htmlFor="rem-title">Título</Label>
            <Input
              id="rem-title"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              placeholder="Pagar predial, vencimiento tarjeta…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rem-date">Fecha</Label>
              <Input
                id="rem-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.currentTarget.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rem-amount">Monto (opcional)</Label>
              <Input
                id="rem-amount"
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
            <Label htmlFor="rem-account">Cuenta relacionada (opcional)</Label>
            <Select
              value={accountId ?? NO_ACCOUNT}
              onValueChange={(v) =>
                setAccountId(v === NO_ACCOUNT ? null : v)
              }
            >
              <SelectTrigger id="rem-account">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ACCOUNT}>—</SelectItem>
                {liveAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
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
            {isEdit ? 'Guardar cambios' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
