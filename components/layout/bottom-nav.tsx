'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { BOTTOM_NAV } from '@/lib/nav'
import { cn } from '@/lib/utils/cn'

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Bottom navigation móvil. 5 ítems con un "+" central elevado que abre
 * el formulario de nuevo movimiento. En tablet/desktop queda oculto
 * (la navegación vive en la Sidebar).
 */
export function BottomNav() {
  const pathname = usePathname()
  const [first, second] = BOTTOM_NAV.slice(0, 2)
  const [third, fourth] = BOTTOM_NAV.slice(2, 4)

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card lg:hidden safe-bottom"
    >
      <ul className="grid grid-cols-5 items-end">
        {[first, second].map((item) => {
          if (!item) return null
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-1 pb-2 pt-3 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
        <li className="flex justify-center">
          <Link
            href="/movimientos/nuevo"
            aria-label="Nuevo movimiento"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </li>
        {[third, fourth].map((item) => {
          if (!item) return null
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-1 pb-2 pt-3 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
