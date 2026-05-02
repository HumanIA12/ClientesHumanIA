import {
  Home,
  Wallet,
  Repeat,
  Calendar,
  PieChart,
  Bell,
  Settings,
  Tags,
  Receipt,
  Target,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/movimientos', label: 'Movimientos', icon: Receipt },
  { href: '/cuentas', label: 'Cuentas', icon: Wallet },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/reportes', label: 'Reportes', icon: PieChart },
]

export const SECONDARY_NAV: NavItem[] = [
  { href: '/categorias', label: 'Categorías', icon: Tags },
  { href: '/recurrentes', label: 'Recurrentes', icon: Repeat },
  { href: '/presupuestos', label: 'Presupuestos', icon: Target },
  { href: '/recordatorios', label: 'Recordatorios', icon: Bell },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
]

/** Items del bottom nav móvil. El "+" se renderiza fuera de esta lista. */
export const BOTTOM_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/cuentas', label: 'Cuentas', icon: Wallet },
  { href: '/reportes', label: 'Reportes', icon: PieChart },
]
