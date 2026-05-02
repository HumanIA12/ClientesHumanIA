import Link from 'next/link'
import { Archive } from 'lucide-react'
import type { Account } from '@/hooks/use-accounts'
import type { HouseholdMember } from '@/hooks/use-household-members'
import { ACCOUNT_TYPE_META, displayBalance } from '@/lib/accounts'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'

export interface MoneyCardProps {
  account: Account
  owner?: HouseholdMember
  /** Si se pasa, la card es un link a /cuentas/[id]. */
  href?: string
  className?: string
}

/**
 * Tarjeta visual de una cuenta. Muestra el balance, tipo, dueño y un
 * color identificador como banda lateral. Para tarjetas de crédito y
 * préstamos el balance se etiqueta como deuda.
 */
export function MoneyCard({ account, owner, href, className }: MoneyCardProps) {
  const meta = ACCOUNT_TYPE_META[account.type]
  const Icon = meta.icon
  const { value, isDebt } = displayBalance(account)
  const archived = account.is_archived

  const content = (
    <div
      className={cn(
        'group relative flex items-stretch overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow',
        href && 'hover:shadow-md',
        archived && 'opacity-60',
        className
      )}
    >
      <div
        aria-hidden
        className="w-1.5 shrink-0"
        style={{ backgroundColor: account.color }}
      />
      <div className="flex flex-1 items-center gap-4 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: account.color }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{account.name}</h3>
            {archived && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Archive className="h-3 w-3" />
                Archivada
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {meta.label}
            {owner && (
              <>
                {' · '}
                <span
                  className="inline-flex items-center gap-1 align-middle"
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: owner.avatar_color }}
                  />
                  {owner.display_name}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="text-right">
          <p
            className={cn(
              'tabular-nums text-base font-bold',
              isDebt ? 'text-danger' : 'text-foreground'
            )}
          >
            {formatCurrency(value, account.currency)}
          </p>
          {isDebt && (
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Adeudado
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg">
        {content}
      </Link>
    )
  }
  return content
}
