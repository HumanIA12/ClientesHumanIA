'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { qk } from '@/lib/query-keys'
import type { Tables } from '@/lib/types/database'

export type RecurringRule = Tables<'recurring_rules'>

export interface UseRecurringRulesOptions {
  /** Si true (default), excluye reglas pausadas. */
  activeOnly?: boolean
}

/**
 * Lista las reglas recurrentes del household. Por defecto sólo
 * activas (para usar en el dashboard); el CRUD puede pasar
 * activeOnly=false para incluir pausadas. RLS filtra por household.
 */
export function useRecurringRules(
  options: UseRecurringRulesOptions = {}
): UseQueryResult<RecurringRule[]> {
  const { activeOnly = true } = options
  const supabase = createClient()
  return useQuery({
    queryKey: [...qk.recurringRules(), { activeOnly }],
    queryFn: async () => {
      let query = supabase
        .from('recurring_rules')
        .select('*')
        .is('deleted_at', null)
        .order('next_run_date', { ascending: true })
      if (activeOnly) query = query.eq('is_active', true)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,
  })
}
