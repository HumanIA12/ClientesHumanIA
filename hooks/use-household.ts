'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables, TablesUpdate } from '@/lib/types/database'

export type Household = Tables<'households'>

const HOUSEHOLD_KEY = ['household'] as const

export function useHousehold(): UseQueryResult<Household | null> {
  const supabase = createClient()
  return useQuery({
    queryKey: HOUSEHOLD_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useUpdateHousehold() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: TablesUpdate<'households'>
    }) => {
      const { data, error } = await supabase
        .from('households')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: HOUSEHOLD_KEY })
    },
  })
}

export function useUpdateProfile() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: TablesUpdate<'profiles'>
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['household_members'] })
    },
  })
}

export function useSeedDefaultCategories() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('seed_default_categories')
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
