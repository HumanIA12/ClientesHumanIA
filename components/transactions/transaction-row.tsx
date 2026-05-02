import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Transaction } from '@/hooks/use-transactions'
import type { Account } from '@/hooks/use-accounts'
import type { Category } from '@/hooks/use-categories'
import type { HouseholdMember } from '@/hooks/use-household-members'
import {
  TRANSACTION_TYPE_META,
  getCategoryIcon,
} from '@/lib/transactions'
import { formatCurrency } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'

export interface TransactionRowProps {
  transaction: Transaction
  account?: Account
  targetAccount?: Account
  category?: Category
  performer?: HouseholdMember
  /** Si true, muestra la fecha como prefijo (útil cuando la lista no agrupa por día). */
  showDate?: boolean
  /** Si true, envuelve la fila en un Link al detalle del movimiento. */
  asLink?: boolean
}

export function TransactionRow({
  transaction: tx,
  account,
  targetAccount,
  category,
  performer,
  showDate,
  asLink = true,
}: TransactionRowProps) {
  const meta = TRANSACTION_TYPE_META[tx.type]
  const Icon = category
    ? getCategoryIcon(category.icon)
    : meta.icon
  const iconColor = category?.color ?? meta.color

  const sign =
    tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''
  const amountColor =
    tx.type === 'income'
      ? 'text-success'
      : tx.type === 'expense'
        ? 'text-foreground'
        : 'text-muted-foreground'

  const title =
    tx.description?.trim() ||
    category?.name ||
    (tx.type === 'transfer' && account && targetAccount
      ? `${account.name} → ${targetAccount.name}`
      : tx.type === 'credit_payment' && targetAccount
        ? `Pago a ${targetAccount.name}`
        : meta.label)

  const subtitleParts: string[] = []
  if (account) subtitleParts.push(account.name)
  if (tx.type === 'transfer' && targetAccount)
    subtitleParts.push(`→ ${targetAccount.name}`)
  if (performer) subtitleParts.push(performer.display_name)

  const Wrapper = asLink ? Link : 'div'
  const wrapperProps = asLink
    ? {
        href: `/movimientos/${tx.id}`,
        className:
          'flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      }
    : { className: 'flex items-center gap-3 rounded-lg border bg-card p-3' }

  return (
    <Wrapper {...(wrapperProps as { href: string; className: string })}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: iconColor }}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{title}</p>
          {tx.sharing === 'personal' && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Personal
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {showDate && (
            <span className="mr-1">
              {format(new Date(tx.performed_at), 'd MMM', { locale: es })} ·
            </span>
          )}
          {subtitleParts.join(' · ') || meta.label}
        </p>
      </div>

      <p
        className={cn(
          'tabular-nums text-right text-sm font-bold',
          amountColor
        )}
      >
        {sign}
        {formatCurrency(Number(tx.amount), tx.currency)}
      </p>
    </Wrapper>
  )
}
