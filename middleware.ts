import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'

const PUBLIC_PATHS = ['/login', '/callback', '/auth']

/**
 * Middleware de auth.
 *
 * - Refresca la sesión de Supabase en cada request.
 * - Redirige usuarios no autenticados a /login (preservando ?next=).
 * - Redirige usuarios autenticados que entren a /login al /dashboard.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  if (!session && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (session && pathname === '/login') {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Excluye archivos estáticos, _next, api/health, manifest e iconos PWA.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*|icons/.*|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)',
  ],
}
