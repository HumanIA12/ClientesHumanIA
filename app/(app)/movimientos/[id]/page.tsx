'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  useTransactionQuery,
  useDeleteTransaction,
} from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useHouseholdMembers } from '@/hooks/use-household-members'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TransactionRow } from '@/components/transactions/transaction-row'
import { TRANSACTION_TYPE_META } from '@/lib/transactions'
import { formatCurrency } from '@/lib/utils/currency'

export default function MovimientoDetallePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: tx, isLoading, isError } = useTransactionQuery(params?.id)
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const { data: members } = useHouseholdMembers()
  const remove = useDeleteTransaction()
  const [busy, setBusy] = useState(false)

  if (isLoading) {
    return (
      <PageWrapper>
        <Skeleton className="mb-3 h-8 w-40" />
        <Skeleton className="h-32 rounded-lg" />
      </PageWrapper>
    )
  }
  if (isError || !tx) {
    return (
      <PageWrapper title="Movimiento">
        <p className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          No encontramos este movimiento.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/movimientos">Volver</Link>
        </Button>
      </PageWrapper>
    )
  }

  const account = accounts?.find((a) => a.id === tx.account_id)
  const targetAccount = tx.target_account_id
    ? accounts?.find((a) => a.id === tx.target_account_id)
    : undefined
  const category = tx.category_id
    ? categories?.find((c) => c.id === tx.category_id)
    : undefined
  const performer = tx.performed_by
    ? members?.find((m) => m.id === tx.performed_by)
    : undefined
  const registrar = members?.find((m) => m.id === tx.registered_by)

  async function handleDelete() {
    if (!confirm('¿Eliminar este movimiento? Los balances se ajustan.')) return
    setBusy(true)
    try {
      await remove.mutateAsync(tx!.id)
      router.replace('/movimientos')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const meta = TRANSACTION_TYPE_META[tx.type]

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/movimientos" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{meta.label}</h1>
      </div>

      <TransactionRow
        transaction={tx}
        account={account}
        targetAccount={targetAccount}
        category={category}
        performer={performer}
        showDate
      />

      <dl className="mt-4 grid grid-cols-2 gap-4 rounded-lg border bg-card p-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Monto
          </dt>
          <dd className="mt-1 font-semibold tabular-nums">
            {formatCurrency(Number(tx.amount), tx.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Fecha
          </dt>
          <dd className="mt-1 font-medium">
            {format(new Date(tx.performed_at), "d 'de' MMMM yyyy", {
              locale: es,
            })}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Cuenta
          </dt>
          <dd className="mt-1 font-medium">
            {account?.name ?? '—'}
            {targetAccount && <> → {targetAccount.name}</>}
          </dd>
        </div>
        {category && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Categoría
            </dt>
            <dd className="mt-1 font-medium">{category.name}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Quién pagó
          </dt>
          <dd className="mt-1 font-medium">
            {performer?.display_name ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Registrado por
          </dt>
          <dd className="mt-1 font-medium">
            {registrar?.display_name ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Tipo de gasto
          </dt>
          <dd className="mt-1 font-medium">
            {tx.sharing === 'shared' ? 'Compartido' : 'Personal'}
          </dd>
        </div>
        {tx.notes && (
          <div className="col-span-2">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Notas
            </dt>
            <dd className="mt-1 whitespace-pre-wrap">{tx.notes}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/movimientos/${tx.id}/editar`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
        <Button variant="outline" onClick={handleDelete} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Eliminar
        </Button>
      </div>
    </PageWrapper>
  )
}
