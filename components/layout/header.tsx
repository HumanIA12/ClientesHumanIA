import Link from 'next/link'
import { Bell } from 'lucide-react'
import { UserMenu } from './user-menu'

export interface HeaderProps {
  displayName: string
  email: string | null
  avatarColor: string
  /** Cantidad de notificaciones pendientes (recordatorios sin leer, etc.). */
  notificationCount?: number
}

export function Header({
  displayName,
  email,
  avatarColor,
  notificationCount = 0,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-card/80 px-4 backdrop-blur lg:px-6 safe-top">
      <div className="flex items-center gap-3 lg:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          aria-label="NEXO"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            N
          </div>
          <span className="text-base font-semibold">NEXO</span>
        </Link>
      </div>

      <div className="hidden lg:block">
        <p className="text-sm text-muted-foreground">Hola, {displayName}</p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/recordatorios"
          aria-label={
            notificationCount > 0
              ? `Notificaciones (${notificationCount})`
              : 'Notificaciones'
          }
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Link>
        <UserMenu
          displayName={displayName}
          email={email}
          avatarColor={avatarColor}
        />
      </div>
    </header>
  )
}
