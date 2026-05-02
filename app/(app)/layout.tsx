import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Layout de rutas autenticadas.
 *
 * Verifica sesión a nivel de RSC (defensa en profundidad: el middleware
 * ya redirigió, pero esto cubre el caso de cookies expiradas entre
 * middleware y RSC y elimina cualquier flash de contenido).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  return <div className="min-h-dvh">{children}</div>
}
