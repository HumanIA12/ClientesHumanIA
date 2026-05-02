'use client'

import { useEffect, useMemo, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'
import { Receipt, Loader2 } from 'lucide-react'
import {
  useTransactions,
  type TransactionFilters,
  type Transaction,
} from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useHouseholdMembers } from '@/hooks/use-household-members'
import { TransactionRow } from './transaction-row'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

function formatGroupHeader(date: Date): string {
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  return format(date, "EEEE d 'de' MMMM", { locale: es })
}

function groupByDay(transactions: Transaction[]) {
  const groups = new Map<string, { date: Date; rows: Transaction[] }>()
  for (const tx of transactions) {
    const date = new Date(tx.performed_at)
    const key = format(date, 'yyyy-MM-dd')
    const existing = groups.get(key)
    if (existing) existing.rows.push(tx)
    else groups.set(key, { date, rows: [tx] })
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, value]) => ({ key, ...value }))
}

export interface TransactionListProps {
  filters?: TransactionFilters
}

export function TransactionList({ filters = {} }: TransactionListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useTransactions(filters)

  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const { data: members } = useHouseholdMembers()

  const accountById = useMemo(() => {
    const m = new Map<string, NonNullable<typeof accounts>[number]>()
    for (const a of accounts ?? []) m.set(a.id, a)
    return m
  }, [accounts])
  const categoryById = useMemo(() => {
    const m = new Map<string, NonNullable<typeof categories>[number]>()
    for (const c of categories ?? []) m.set(c.id, c)
    return m
  }, [categories])
  const memberById = useMemo(() => {
    const m = new Map<string, NonNullable<typeof members>[number]>()
    for (const x of members ?? []) m.set(x.id, x)
    return m
  }, [members])

  const allRows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.rows),
    [data]
  )
  const groups = useMemo(() => groupByDay(allRows), [allRows])

  // Infinite scroll: observa el sentinel al final.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (
          entry?.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isFetching
        ) {
          void fetchNextPage()
        }
      },
      { rootMargin: '300px 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetching, isFetchingNextPage])

  if (isLoading) return <ListSkeleton />

  if (isError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
        No pudimos cargar los movimientos: {error?.message ?? 'error'}
      </div>
    )
  }

  if (allRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Receipt className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold">Sin movimientos todavía</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra tu primer gasto, ingreso o transferencia con el botón &ldquo;+&rdquo;.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map(({ key, date, rows }) => (
        <section key={key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {formatGroupHeader(date)}
          </h3>
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
              />
            ))}
          </div>
        </section>
      ))}

      <div ref={sentinelRef} aria-hidden className="h-px" />

      {isFetchingNextPage && (
        <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando más…
        </p>
      )}
      {!isFetchingNextPage && hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => fetchNextPage()}>
            Cargar más
          </Button>
        </div>
      )}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
