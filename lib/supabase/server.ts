import { cookies } from 'next/headers'
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

/**
 * Supabase client para Server Components / pages.
 * Lee la sesión desde las cookies del request.
 */
export function createServerClient() {
  return createServerComponentClient<Database>({ cookies })
}

/**
 * Supabase client para Route Handlers (app/api/*, callbacks).
 * Permite leer y escribir cookies.
 */
export function createRouteClient() {
  return createRouteHandlerClient<Database>({ cookies })
}
