'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Pencil, Archive, ArchiveRestore, ArrowLeft, Loader2 } from 'lucide-react'
import {
  useAccount,
  useArchiveAccount,
  useUpdateAccount,
} from '@/hooks/use-accounts'
import { useHouseholdMembers } from '@/hooks/use-household-members'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyCard } from '@/components/accounts/money-card'
import { TransactionList } from '@/components/transactions/transaction-list'
import { ACCOUNT_TYPE_META, displayBalance } from '@/lib/accounts'
import { formatCurrency } from '@/lib/utils/currency'

export default function CuentaDetallePage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { data: account, isLoading, isError } = useAccount(id)
  const { data: members } = useHouseholdMembers()
  const archive = useArchiveAccount()
  const update = useUpdateAccount()
  const [busy, setBusy] = useState(false)

  if (isLoading) {
    return (
      <PageWrapper>
        <Skeleton className="mb-3 h-8 w-40" />
        <Skeleton className="h-32 rounded-lg" />
      </PageWrapper>
    )
  }

  if (isError || !account) {
    return (
      <PageWrapper title="Cuenta">
        <p className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          No encontramos esta cuenta.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/cuentas">Volver</Link>
        </Button>
      </PageWrapper>
    )
  }

  const meta = ACCOUNT_TYPE_META[account.type]
  const owner = account.owner_profile_id
    ? members?.find((m) => m.id === account.owner_profile_id)
    : undefined
  const { isDebt } = displayBalance(account)

  async function handleArchive() {
    if (!confirm('¿Archivar esta cuenta? No se eliminan los movimientos.'))
      return
    setBusy(true)
    try {
      await archive.mutateAsync(account!.id)
      router.replace('/cuentas')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleUnarchive() {
    setBusy(true)
    try {
      await update.mutateAsync({
        id: account!.id,
        patch: { is_archived: false },
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cuentas" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{account.name}</h1>
      </div>

      <MoneyCard account={account} owner={owner} />

      <dl className="mt-4 grid grid-cols-2 gap-4 rounded-lg border bg-card p-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Tipo
          </dt>
          <dd className="mt-1 font-medium">{meta.label}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Dueño
          </dt>
          <dd className="mt-1 font-medium">
            {owner?.display_name ?? 'Compartida'}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {isDebt ? 'Deuda' : 'Saldo'}
          </dt>
          <dd className="mt-1 font-semibold tabular-nums">
            {formatCurrency(
              Math.abs(Number(account.current_balance)),
              account.currency
            )}
          </dd>
        </div>
        {account.credit_limit !== null && account.credit_limit !== undefined && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Límite de crédito
            </dt>
            <dd className="mt-1 font-medium tabular-nums">
              {formatCurrency(Number(account.credit_limit), account.currency)}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/cuentas/${account.id}/editar`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
        {account.is_archived ? (
          <Button
            variant="outline"
            onClick={handleUnarchive}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArchiveRestore className="mr-2 h-4 w-4" />
            )}
            Desarchivar
          </Button>
        ) : (
          <Button variant="outline" onClick={handleArchive} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Archive className="mr-2 h-4 w-4" />
            )}
            Archivar
          </Button>
        )}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Movimientos</h2>
      <TransactionList filters={{ accountId: account.id }} />
    </PageWrapper>
  )
}
