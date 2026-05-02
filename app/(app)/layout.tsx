import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { Fab } from '@/components/layout/fab'

export const dynamic = 'force-dynamic'

/**
 * Shell de la app autenticada.
 *
 * - Sidebar fija (240px) en lg+
 * - Header sticky con saludo, notificaciones y menú de usuario
 * - BottomNav fijo en móvil con FAB central de "nuevo movimiento"
 * - FAB flotante de "nuevo movimiento" en desktop
 * - Verifica sesión en RSC (defensa en profundidad sobre middleware) y
 *   carga el profile del household para personalizar el header.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_color')
    .eq('id', user.id)
    .maybeSingle()

  const displayName =
    profile?.display_name ?? user.email?.split('@')[0] ?? 'Usuario'
  const avatarColor = profile?.avatar_color ?? '#6C63FF'

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          displayName={displayName}
          email={user.email ?? null}
          avatarColor={avatarColor}
        />
        <main className="flex-1">{children}</main>
      </div>
      <Fab />
      <BottomNav />
    </div>
  )
}
