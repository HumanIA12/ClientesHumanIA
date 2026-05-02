import {
  Banknote,
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  HandCoins,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { AccountType } from '@/lib/types/database'

export interface AccountTypeMeta {
  label: string
  /** Etiqueta plural para encabezados de grupo. */
  pluralLabel: string
  icon: LucideIcon
  /** Color por defecto para cuentas nuevas de este tipo. */
  defaultColor: string
}

export const ACCOUNT_TYPE_META: Record<AccountType, AccountTypeMeta> = {
  checking: {
    label: 'Cuenta corriente',
    pluralLabel: 'Cuentas corrientes',
    icon: Landmark,
    defaultColor: '#1E6B4A',
  },
  savings: {
    label: 'Ahorros',
    pluralLabel: 'Ahorros',
    icon: PiggyBank,
    defaultColor: '#27AE60',
  },
  cash: {
    label: 'Efectivo',
    pluralLabel: 'Efectivo',
    icon: Banknote,
    defaultColor: '#F4A823',
  },
  credit_card: {
    label: 'Tarjeta de crédito',
    pluralLabel: 'Tarjetas de crédito',
    icon: CreditCard,
    defaultColor: '#E05A5A',
  },
  investment: {
    label: 'Inversión',
    pluralLabel: 'Inversiones',
    icon: TrendingUp,
    defaultColor: '#2D9CDB',
  },
  loan: {
    label: 'Préstamo',
    pluralLabel: 'Préstamos',
    icon: HandCoins,
    defaultColor: '#6C63FF',
  },
  other: {
    label: 'Otro',
    pluralLabel: 'Otros',
    icon: Wallet,
    defaultColor: '#1E6B4A',
  },
}

/** Orden canónico para mostrar los grupos en la lista de cuentas. */
export const ACCOUNT_TYPE_ORDER: AccountType[] = [
  'checking',
  'savings',
  'cash',
  'investment',
  'credit_card',
  'loan',
  'other',
]

/** Paleta sugerida al crear una cuenta. */
export const ACCOUNT_COLOR_PALETTE = [
  '#1E6B4A',
  '#27AE60',
  '#2D9CDB',
  '#F4A823',
  '#E05A5A',
  '#6C63FF',
  '#FF6B9D',
  '#1A1A1A',
] as const

/**
 * Para tarjetas de crédito mostramos cuánto se debe (positivo).
 * Para préstamos también. Para el resto, el balance tal cual.
 */
export function displayBalance(account: {
  type: AccountType
  current_balance: number
}): { value: number; isDebt: boolean } {
  if (account.type === 'credit_card' || account.type === 'loan') {
    return { value: Math.abs(account.current_balance), isDebt: true }
  }
  return { value: account.current_balance, isDebt: false }
}
