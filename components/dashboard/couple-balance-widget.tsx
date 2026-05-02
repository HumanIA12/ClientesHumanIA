'use client'

import { Users } from 'lucide-react'
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
 * Quién pagó cuánto en gastos compartidos del mes.
 *
 * Es informativo: NO asume que la pareja divide al 50/50. Si tienen
 * una cuenta compartida que paga la mayoría de los gastos, ahí los
 * pagos quedarán a nombre de quien registró el movimiento. Lo
 * relevante es la transparencia, no la liquidación automática.
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

  const memberTotals = members
    .map((m) => ({
      member: m,
      paid: summary.sharedExpensesByPerson[m.id] ?? 0,
    }))
    .sort((a, b) => b.paid - a.paid)

  const totalShared = summary.sharedExpenses
  const totalPersonal = summary.personalExpenses

  return (
    <section
      className={cn(
        'rounded-xl border bg-card p-5 text-card-foreground',
        className
      )}
    >
      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        Quién pagó qué · este mes
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Sólo gastos marcados como compartidos. Sin reparto automático.
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Compartido</p>
          <p className="font-semibold tabular-nums">
            {formatCurrency(totalShared, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Personal</p>
          <p className="font-semibold tabular-nums">
            {formatCurrency(totalPersonal, currency)}
          </p>
        </div>
      </div>

      {totalShared === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Sin gastos compartidos este mes.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {memberTotals.map(({ member, paid }) => {
            const pct = totalShared > 0 ? (paid / totalShared) * 100 : 0
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
                    {formatCurrency(paid, currency)}{' '}
                    <span className="text-xs text-muted-foreground">
                      ({pct.toFixed(0)}%)
                    </span>
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
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
