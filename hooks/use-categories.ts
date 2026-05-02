'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { qk } from '@/lib/query-keys'
import type {
  Tables,
  TablesInsert,
  TransactionType,
} from '@/lib/types/database'

export type Category = Tables<'categories'>
export type CategoryInsert = TablesInsert<'categories'>

export function useCategories(): UseQueryResult<Category[]> {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.categories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export interface NewCategoryPayload {
  name: string
  icon: string
  color: string
  kind: TransactionType
  parent_id?: string | null
}

export function useCreateCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: NewCategoryPayload) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single()
      if (profileError) throw profileError

      const insert: CategoryInsert = {
        household_id: profile.household_id,
        name: payload.name,
        icon: payload.icon,
        color: payload.color,
        kind: payload.kind,
        parent_id: payload.parent_id ?? null,
      }
      const { data, error } = await supabase
        .from('categories')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.categories() })
    },
  })
}
