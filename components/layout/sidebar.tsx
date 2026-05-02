'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from '@/lib/nav'
import { cn } from '@/lib/utils/cn'

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavSection({
  items,
  pathname,
  label,
}: {
  items: NavItem[]
  pathname: string
  label?: string
}) {
  return (
    <div className="space-y-1">
      {label && (
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      {items.map(({ href, label: navLabel, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{navLabel}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 lg:border-r lg:bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          N
        </div>
        <span className="text-base font-semibold">NEXO</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <NavSection items={PRIMARY_NAV} pathname={pathname} />
        <div className="my-3 h-px bg-border" />
        <NavSection
          items={SECONDARY_NAV}
          pathname={pathname}
          label="Configuración"
        />
      </nav>
    </aside>
  )
}
