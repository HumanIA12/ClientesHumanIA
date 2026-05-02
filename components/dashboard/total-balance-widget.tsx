'use client'

import { Wallet } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import {
  calculateLiquidBalance,
  calculateCreditDebt,
} from '@/lib/utils/balance'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

export interface TotalBalanceWidgetProps {
  currency?: string
  className?: string
}

/**
 * Saldo total de la pareja: líquido (cuentas + ahorros + efectivo +
 * inversiones) menos deuda en tarjetas de crédito y préstamos.
 * Excluye archivadas y soft-deleted.
 */
export function TotalBalanceWidget({
  currency = 'MXN',
  className,
}: TotalBalanceWidgetProps) {
  const { data: accounts, isLoading } = useAccounts()

  if (isLoading) {
    return <Skeleton className={cn('h-32 w-full rounded-xl', className)} />
  }

  const liquid = calculateLiquidBalance(accounts ?? [])
  const debt = calculateCreditDebt(accounts ?? [])
  const net = liquid - debt

  return (
    <section
      className={cn(
        'rounded-xl border bg-card p-5 text-card-foreground',
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" />
        Patrimonio neto
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums">
        {formatCurrency(net, currency)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Líquido</p>
          <p className="font-semibold tabular-nums text-success">
            {formatCurrency(liquid, currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Deuda</p>
          <p className="font-semibold tabular-nums text-danger">
            {formatCurrency(debt, currency)}
          </p>
        </div>
      </div>
    </section>
  )
}
