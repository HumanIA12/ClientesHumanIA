'use client'

import { Shield, Info } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { useRecurringRules } from '@/hooks/use-recurring-rules'
import { useHousehold } from '@/hooks/use-household'
import { calculateSafeAvailableBreakdown } from '@/lib/utils/balance'
import { formatCurrency } from '@/lib/utils/currency'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Widget hero del dashboard.
 *
 * Disponible Seguro = saldo líquido − pagos recurrentes futuros del
 * mes en curso − colchón. Es lo que la pareja puede gastar HOY sin
 * comprometer compromisos del mes (renta, suscripciones, mínimos de
 * tarjeta que aún no se han cobrado).
 */
export function SafeAvailableWidget() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts()
  const { data: rules, isLoading: loadingRules } = useRecurringRules()
  const { data: household } = useHousehold()

  if (loadingAccounts || loadingRules) {
    return <Skeleton className="h-44 w-full rounded-2xl" />
  }

  const buffer = Number(household?.safe_buffer ?? 0)
  const currency = household?.currency ?? 'MXN'

  const { liquid, upcoming, safe } = calculateSafeAvailableBreakdown({
    accounts: accounts ?? [],
    recurringRules: rules ?? [],
    buffer,
  })

  return (
    <section
      aria-label="Disponible seguro"
      className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg shadow-primary/20"
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider opacity-80">
        <Shield className="h-3.5 w-3.5" />
        Disponible seguro
      </div>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
        {formatCurrency(safe, currency)}
      </p>
      <p className="mt-1 flex items-start gap-1.5 text-xs opacity-90">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        Líquido <strong>{formatCurrency(liquid, currency)}</strong> − pagos
        del mes <strong>{formatCurrency(upcoming, currency)}</strong>
        {buffer > 0 && (
          <>
            {' '}− colchón <strong>{formatCurrency(buffer, currency)}</strong>
          </>
        )}
      </p>
    </section>
  )
}
