import { NextResponse, type NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

/**
 * Handler de magic link / OAuth.
 *
 * Supabase redirige aquí con `?code=...` (PKCE) tras el clic del usuario.
 * Intercambiamos el code por una sesión y guardamos las cookies, luego
 * redirigimos a `?next=` (default /dashboard) o a /login con un error.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/dashboard'

  if (!code) {
    const dest = new URL('/login', url.origin)
    dest.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(dest)
  }

  const supabase = createRouteClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const dest = new URL('/login', url.origin)
    dest.searchParams.set('error', error.message)
    return NextResponse.redirect(dest)
  }

  const dest = new URL(next.startsWith('/') ? next : '/dashboard', url.origin)
  return NextResponse.redirect(dest)
}
