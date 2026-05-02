'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { qk } from '@/lib/query-keys'
import type { Tables } from '@/lib/types/database'

export type RecurringRule = Tables<'recurring_rules'>

/**
 * Lista las reglas recurrentes activas del household. Ordenadas por
 * next_run_date ascendente para que la UI las pueda usar tal cual en
 * "próximos pagos". RLS filtra por household.
 */
export function useRecurringRules(): UseQueryResult<RecurringRule[]> {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.recurringRules(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_rules')
        .select('*')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('next_run_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,
  })
}
