'use client'

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { qk } from '@/lib/query-keys'
import type { Tables } from '@/lib/types/database'

export type HouseholdMember = Pick<
  Tables<'profiles'>,
  'id' | 'display_name' | 'avatar_color' | 'email'
>

/**
 * Devuelve los profiles del household actual (RLS filtra). En el MVP
 * son 2 personas. Se usa para seleccionar dueño de cuenta y
 * performed_by en transacciones.
 */
export function useHouseholdMembers(): UseQueryResult<HouseholdMember[]> {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.householdMembers(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_color, email')
        .order('display_name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
