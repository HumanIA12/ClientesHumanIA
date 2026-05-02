'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/types/database'

/**
 * Supabase client para uso en Client Components.
 * Lee la sesión desde cookies del navegador.
 */
export function createClient() {
  return createClientComponentClient<Database>()
}
