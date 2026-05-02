import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  CreditCard,
  Utensils,
  Car,
  Home,
  Heart,
  Gamepad2,
  Wallet,
  ShoppingBag,
  Plane,
  GraduationCap,
  Lightbulb,
  Wifi,
  Phone,
  Stethoscope,
  Coffee,
  Gift,
  Briefcase,
  PiggyBank,
  Bus,
  Fuel,
  Receipt,
  Shirt,
  Dumbbell,
  PawPrint,
  Baby,
  Sparkles,
  Tv,
  Music,
  Package,
  Banknote,
  type LucideIcon,
} from 'lucide-react'
import type { TransactionType } from '@/lib/types/database'

export interface TransactionTypeMeta {
  label: string
  /** Verbo corto: "Gastaste", "Ingresaste", etc. para feedbacks. */
  verb: string
  icon: LucideIcon
  /** Color principal del tipo, para badges y CTAs. */
  color: string
  /** Si afecta como gasto en reportes (excluye credit_payment). */
  countsAsExpense: boolean
}

export const TRANSACTION_TYPE_META: Record<
  TransactionType,
  TransactionTypeMeta
> = {
  expense: {
    label: 'Gasto',
    verb: 'Gastaste',
    icon: ArrowDownCircle,
    color: '#E05A5A',
    countsAsExpense: true,
  },
  income: {
    label: 'Ingreso',
    verb: 'Ingresaste',
    icon: ArrowUpCircle,
    color: '#27AE60',
    countsAsExpense: false,
  },
  transfer: {
    label: 'Transferencia',
    verb: 'Transferiste',
    icon: ArrowLeftRight,
    color: '#2D9CDB',
    countsAsExpense: false,
  },
  credit_payment: {
    label: 'Pago de tarjeta',
    verb: 'Pagaste tarjeta',
    icon: CreditCard,
    color: '#6C63FF',
    countsAsExpense: false,
  },
}

/**
 * Catálogo cerrado de iconos disponibles para categorías. La columna
 * `categories.icon` guarda la key. Si la key no está en el mapa, la UI
 * cae al icono por defecto (Wallet).
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  bus: Bus,
  fuel: Fuel,
  home: Home,
  heart: Heart,
  gamepad: Gamepad2,
  wallet: Wallet,
  bag: ShoppingBag,
  plane: Plane,
  education: GraduationCap,
  bulb: Lightbulb,
  wifi: Wifi,
  phone: Phone,
  health: Stethoscope,
  coffee: Coffee,
  gift: Gift,
  work: Briefcase,
  savings: PiggyBank,
  receipt: Receipt,
  shirt: Shirt,
  gym: Dumbbell,
  pet: PawPrint,
  baby: Baby,
  beauty: Sparkles,
  tv: Tv,
  music: Music,
  package: Package,
  cash: Banknote,
  circle: Wallet,
}

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS)

export function getCategoryIcon(key: string | null | undefined): LucideIcon {
  if (!key) return Wallet
  return CATEGORY_ICONS[key] ?? Wallet
}

/** Paleta sugerida para categorías nuevas. */
export const CATEGORY_COLOR_PALETTE = [
  '#1E6B4A',
  '#27AE60',
  '#2D9CDB',
  '#F4A823',
  '#E05A5A',
  '#6C63FF',
  '#FF6B9D',
  '#1A1A1A',
] as const
