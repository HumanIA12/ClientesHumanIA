'use client'

import { Users, ArrowRight } from 'lucide-react'
import { useMonthSummary } from '@/hooks/use-month-summary'
import { useHouseholdMembers } from '@/hooks/use-household-members'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

export interface CoupleBalanceWidgetProps {
  className?: string
  currency?: string
}

/**
 * Balance básico del mes entre los 2 miembros de la pareja:
 * cuánto pagó cada uno en gastos compartidos y cuánto debería ajustar
 * para que ambos hayan aportado la mitad. Si la pareja decidió otro
 * reparto, este widget sólo es informativo.
 *
 * Asume household de 2 personas. Si hay más o menos, muestra los
 * totales sin la liquidación.
 */
export function CoupleBalanceWidget({
  className,
  currency = 'MXN',
}: CoupleBalanceWidgetProps) {
  const { data: summary, isLoading: loadingSummary } = useMonthSummary()
  const { data: members, isLoading: loadingMembers } = useHouseholdMembers()

  if (loadingSummary || loadingMembers || !summary || !members) {
    return <Skeleton className={cn('h-44 w-full rounded-xl', className)} />
  }

  const memberTotals = members.map((m) => ({
    member: m,
    paid: summary.sharedExpensesByPerson[m.id] ?? 0,
  }))

  const totalShared = summary.sharedExpenses
  const fairShare = members.length > 0 ? totalShared / members.length : 0

  // Liquidación entre 2: el que pagó menos le debe al otro la diferencia / 2.
  const settle =
    members.length === 2 && memberTotals[0] && memberTotals[1]
      ? (() => {
          const [a, b] = memberTotals
          if (!a || !b) return null
          if (a.paid === b.paid) return null
          const diff = Math.abs(a.paid - b.paid) / 2
          const debtor = a.paid < b.paid ? a.member : b.member
          const creditor = a.paid < b.paid ? b.member : a.member
          return { debtor, creditor, amount: diff }
        })()
      : null

  return (
    <section
      className={cn(
        'rounded-xl border bg-card p-5 text-card-foreground',
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        Balance de la pareja · este mes
      </div>

      <p className="text-sm text-muted-foreground">
        Total compartido{' '}
        <span className="font-semibold text-foreground">
          {formatCurrency(totalShared, currency)}
        </span>
      </p>

      <div className="mt-3 space-y-2">
        {memberTotals.map(({ member, paid }) => {
          const pct = totalShared > 0 ? (paid / totalShared) * 100 : 0
          const delta = paid - fairShare
          return (
            <div key={member.id}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: member.avatar_color }}
                  />
                  {member.display_name}
                </span>
                <span className="tabular-nums">
                  {formatCurrency(paid, currency)}
                </span>
              </div>
              <div
                className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: member.avatar_color,
                  }}
                />
              </div>
              <p
                className={cn(
                  'mt-0.5 text-[11px]',
                  delta >= 0 ? 'text-success' : 'text-muted-foreground'
                )}
              >
                {delta >= 0
                  ? `+${formatCurrency(Math.abs(delta), currency)} sobre la mitad`
                  : `${formatCurrency(Math.abs(delta), currency)} bajo la mitad`}
              </p>
            </div>
          )
        })}
      </div>

      {settle && totalShared > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
          <span className="font-medium">{settle.debtor.display_name}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{settle.creditor.display_name}</span>
          <span className="ml-auto tabular-nums font-semibold">
            {formatCurrency(settle.amount, currency)}
          </span>
        </div>
      )}
    </section>
  )
}
