'use client'

import { useMemo } from 'react'
import { Plus, WalletCards } from 'lucide-react'
import Link from 'next/link'
import { useAccounts, type Account } from '@/hooks/use-accounts'
import {
  useHouseholdMembers,
  type HouseholdMember,
} from '@/hooks/use-household-members'
import {
  ACCOUNT_TYPE_META,
  ACCOUNT_TYPE_ORDER,
  displayBalance,
} from '@/lib/accounts'
import { formatCurrency } from '@/lib/utils/currency'
import { calculateLiquidBalance } from '@/lib/utils/balance'
import { MoneyCard } from './money-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AccountType } from '@/lib/types/database'

/**
 * Agrupa cuentas por tipo manteniendo el orden canónico de
 * ACCOUNT_TYPE_ORDER. Sólo devuelve grupos con al menos una cuenta.
 */
function groupByType(accounts: Account[]) {
  const map = new Map<AccountType, Account[]>()
  for (const a of accounts) {
    const list = map.get(a.type) ?? []
    list.push(a)
    map.set(a.type, list)
  }
  return ACCOUNT_TYPE_ORDER.flatMap((type) => {
    const list = map.get(type)
    if (!list || list.length === 0) return []
    return [{ type, accounts: list }]
  })
}

export function AccountList() {
  const { data: accounts, isLoading, isError, error } = useAccounts()
  const { data: members } = useHouseholdMembers()

  const ownerMap = useMemo(() => {
    const m = new Map<string, HouseholdMember>()
    for (const member of members ?? []) m.set(member.id, member)
    return m
  }, [members])

  const groups = useMemo(
    () => groupByType((accounts ?? []).filter((a) => !a.is_archived)),
    [accounts]
  )
  const archived = useMemo(
    () => (accounts ?? []).filter((a) => a.is_archived),
    [accounts]
  )

  const liquid = useMemo(
    () => calculateLiquidBalance(accounts ?? []),
    [accounts]
  )

  if (isLoading) return <AccountListSkeleton />

  if (isError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
        No pudimos cargar las cuentas: {error?.message ?? 'error desconocido'}
      </div>
    )
  }

  if (!accounts || accounts.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-card p-5">
        <p className="text-sm text-muted-foreground">Saldo líquido total</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {formatCurrency(liquid)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Suma de cuentas corrientes, ahorros, efectivo e inversiones. No
          incluye tarjetas ni préstamos.
        </p>
      </section>

      {groups.map(({ type, accounts: group }) => {
        const meta = ACCOUNT_TYPE_META[type]
        const subtotal = group.reduce((sum, a) => {
          const { value, isDebt } = displayBalance(a)
          return sum + (isDebt ? -value : value)
        }, 0)
        return (
          <section key={type}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {meta.pluralLabel}
              </h2>
              <p className="tabular-nums text-sm font-semibold">
                {formatCurrency(subtotal)}
              </p>
            </div>
            <div className="space-y-2">
              {group.map((account) => (
                <MoneyCard
                  key={account.id}
                  account={account}
                  owner={
                    account.owner_profile_id
                      ? ownerMap.get(account.owner_profile_id)
                      : undefined
                  }
                  href={`/cuentas/${account.id}`}
                />
              ))}
            </div>
          </section>
        )
      })}

      {archived.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Archivadas
          </h2>
          <div className="space-y-2">
            {archived.map((account) => (
              <MoneyCard
                key={account.id}
                account={account}
                owner={
                  account.owner_profile_id
                    ? ownerMap.get(account.owner_profile_id)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function AccountListSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-24 rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WalletCards className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold">Aún no tienes cuentas</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Crea tu primera cuenta para empezar a registrar movimientos.
      </p>
      <Button asChild className="mt-4">
        <Link href="/cuentas/nueva">
          <Plus className="mr-2 h-4 w-4" />
          Nueva cuenta
        </Link>
      </Button>
    </div>
  )
}
