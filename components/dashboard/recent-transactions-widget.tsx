'use client'

import Link from 'next/link'
import { ChevronRight, Receipt } from 'lucide-react'
import { useTransactions } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useHouseholdMembers } from '@/hooks/use-household-members'
import { TransactionRow } from '@/components/transactions/transaction-row'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

export interface RecentTransactionsWidgetProps {
  /** Cuántos movimientos mostrar. Default 5. */
  limit?: number
  className?: string
}

export function RecentTransactionsWidget({
  limit = 5,
  className,
}: RecentTransactionsWidgetProps) {
  const { data, isLoading } = useTransactions()
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const { data: members } = useHouseholdMembers()

  if (isLoading) {
    return (
      <section
        className={cn('rounded-xl border bg-card p-5', className)}
      >
        <Skeleton className="mb-3 h-3 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </section>
    )
  }

  const rows = (data?.pages.flatMap((p) => p.rows) ?? []).slice(0, limit)
  const accountById = new Map((accounts ?? []).map((a) => [a.id, a] as const))
  const categoryById = new Map(
    (categories ?? []).map((c) => [c.id, c] as const)
  )
  const memberById = new Map((members ?? []).map((m) => [m.id, m] as const))

  return (
    <section
      className={cn('rounded-xl border bg-card p-5 text-card-foreground', className)}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Receipt className="h-3.5 w-3.5" />
          Movimientos recientes
        </div>
        <Link
          href="/movimientos"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ver todo <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Sin movimientos todavía.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              account={accountById.get(tx.account_id)}
              targetAccount={
                tx.target_account_id
                  ? accountById.get(tx.target_account_id)
                  : undefined
              }
              category={
                tx.category_id ? categoryById.get(tx.category_id) : undefined
              }
              performer={
                tx.performed_by ? memberById.get(tx.performed_by) : undefined
              }
              showDate
            />
          ))}
        </div>
      )}
    </section>
  )
}
