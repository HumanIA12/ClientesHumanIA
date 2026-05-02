'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { useHouseholdMembers } from '@/hooks/use-household-members'
import { useCategories } from '@/hooks/use-categories'
import {
  useCreateTransaction,
  useUpdateTransaction,
  type Transaction,
} from '@/hooks/use-transactions'
import { TRANSACTION_TYPE_META } from '@/lib/transactions'
import {
  ACCOUNT_TYPE_META,
} from '@/lib/accounts'
import type { TransactionType, Sharing } from '@/lib/types/database'
import { transactionFormSchema } from '@/lib/validation/transaction'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NumericKeypad } from './numeric-keypad'
import { CategoryPicker } from './category-picker'
import { cn } from '@/lib/utils/cn'

const TYPES: TransactionType[] = [
  'expense',
  'income',
  'transfer',
  'credit_payment',
]

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export interface TransactionFormProps {
  /** Llamado tras un alta exitosa. Si no se pasa, navega a /movimientos. */
  onCreated?: () => void
  /** Tipo inicial. Default 'expense'. */
  defaultType?: TransactionType
  /** Si se pasa, el formulario edita esta transacción en lugar de crear. */
  transaction?: Transaction
}

export function TransactionForm({
  onCreated,
  defaultType = 'expense',
  transaction,
}: TransactionFormProps) {
  const router = useRouter()
  const { data: accounts } = useAccounts()
  const { data: members } = useHouseholdMembers()
  const { data: categories } = useCategories()
  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction()
  const isEdit = !!transaction

  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? defaultType
  )
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : '0'
  )
  const [accountId, setAccountId] = useState<string>(
    transaction?.account_id ?? ''
  )
  const [targetAccountId, setTargetAccountId] = useState<string>(
    transaction?.target_account_id ?? ''
  )
  const [categoryId, setCategoryId] = useState<string | null>(
    transaction?.category_id ?? null
  )
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [notes, setNotes] = useState(transaction?.notes ?? '')
  const [performedAt, setPerformedAt] = useState<string>(
    transaction
      ? new Date(transaction.performed_at).toISOString().slice(0, 10)
      : todayISO()
  )
  const [performedBy, setPerformedBy] = useState<string | null>(
    transaction?.performed_by ?? null
  )
  const [sharing, setSharing] = useState<Sharing>(transaction?.sharing ?? 'shared')
  const [error, setError] = useState<string | null>(null)

  const liveAccounts = (accounts ?? []).filter(
    (a) => !a.is_archived && a.deleted_at === null
  )
  const creditCards = liveAccounts.filter((a) => a.type === 'credit_card')

  const isExpense = type === 'expense'
  const isTransferLike = type === 'transfer' || type === 'credit_payment'

  function handleTypeChange(next: TransactionType) {
    setType(next)
    setCategoryId(null)
    setTargetAccountId('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = transactionFormSchema.safeParse({
      type,
      amount: Number(amount),
      account_id: accountId || undefined,
      target_account_id: isTransferLike ? targetAccountId || undefined : null,
      category_id: isExpense
        ? categoryId || undefined
        : type === 'income'
          ? categoryId
          : null,
      description,
      notes,
      performed_at: performedAt,
      performed_by: performedBy,
      sharing,
      currency: 'MXN',
    })
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      setError(first?.message ?? 'Datos inválidos')
      return
    }
    const d = parsed.data
    const payload = {
      type,
      amount: d.amount,
      account_id: d.account_id,
      target_account_id:
        'target_account_id' in d && d.target_account_id
          ? d.target_account_id
          : null,
      category_id:
        'category_id' in d && d.category_id ? d.category_id : null,
      description: d.description || null,
      notes: d.notes || null,
      performed_at: new Date(d.performed_at).toISOString(),
      performed_by: d.performed_by,
      sharing: d.sharing,
    }
    try {
      if (isEdit && transaction) {
        await updateTx.mutateAsync({ id: transaction.id, patch: payload })
        router.replace(`/movimientos/${transaction.id}`)
        router.refresh()
      } else {
        await createTx.mutateAsync(payload)
        if (onCreated) onCreated()
        else {
          router.replace('/movimientos')
          router.refresh()
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar el movimiento'
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-4 gap-2 rounded-lg bg-muted p-1 text-xs font-medium">
        {TYPES.map((t) => {
          const meta = TRANSACTION_TYPE_META[t]
          const Icon = meta.icon
          const selected = type === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md px-2 py-2 transition-colors',
                selected
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={selected ? { color: meta.color } : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{meta.label}</span>
            </button>
          )
        })}
      </div>

      <NumericKeypad value={amount} onChange={setAmount} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="account">
            {isTransferLike ? 'Desde' : 'Cuenta'}
          </Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger id="account">
              <SelectValue placeholder="Selecciona una cuenta" />
            </SelectTrigger>
            <SelectContent>
              {liveAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                  <span className="ml-1 text-muted-foreground">
                    · {ACCOUNT_TYPE_META[a.type].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isTransferLike && (
          <div className="space-y-1.5">
            <Label htmlFor="target">
              {type === 'credit_payment' ? 'Tarjeta a pagar' : 'Hacia'}
            </Label>
            <Select value={targetAccountId} onValueChange={setTargetAccountId}>
              <SelectTrigger id="target">
                <SelectValue placeholder="Selecciona una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {(type === 'credit_payment' ? creditCards : liveAccounts).map(
                  (a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                      <span className="ml-1 text-muted-foreground">
                        · {ACCOUNT_TYPE_META[a.type].label}
                      </span>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {(type === 'expense' || type === 'income') && (
        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <CategoryPicker
            categories={categories ?? []}
            value={categoryId}
            onChange={(id) => setCategoryId(id)}
            kind={type}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="performed-at">Fecha</Label>
          <Input
            id="performed-at"
            type="date"
            value={performedAt}
            onChange={(e) => setPerformedAt(e.currentTarget.value)}
            max={todayISO()}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="performed-by">¿Quién pagó?</Label>
          <Select
            value={performedBy ?? ''}
            onValueChange={(v) => setPerformedBy(v || null)}
          >
            <SelectTrigger id="performed-by">
              <SelectValue placeholder="Selecciona" />
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
        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1 text-sm">
          {(['shared', 'personal'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSharing(s)}
              className={cn(
                'rounded-md px-3 py-2 transition-colors',
                sharing === s
                  ? 'bg-background font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s === 'shared' ? 'Compartido' : 'Personal'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          placeholder="Súper, Uber, salario…"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={createTx.isPending || updateTx.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createTx.isPending || updateTx.isPending}
        >
          {(createTx.isPending || updateTx.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEdit ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
