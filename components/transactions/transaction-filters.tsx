'use client'

import { Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { TRANSACTION_TYPE_META } from '@/lib/transactions'
import type { TransactionFilters as Filters } from '@/hooks/use-transactions'
import type { TransactionType } from '@/lib/types/database'

const TYPE_OPTIONS: { value: TransactionType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'expense', label: TRANSACTION_TYPE_META.expense.label },
  { value: 'income', label: TRANSACTION_TYPE_META.income.label },
  { value: 'transfer', label: TRANSACTION_TYPE_META.transfer.label },
  { value: 'credit_payment', label: TRANSACTION_TYPE_META.credit_payment.label },
]

export interface TransactionFiltersBarProps {
  onChange: (filters: Filters) => void
}

export function TransactionFiltersBar({ onChange }: TransactionFiltersBarProps) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState<TransactionType | 'all'>('all')
  const deferredSearch = useDeferredValue(search)

  // Notifica cambios al padre cuando cualquiera de los filtros cambia.
  // Evita re-renders en cascada usando el deferred del search.
  const next: Filters = {
    search: deferredSearch.trim() ? deferredSearch.trim() : undefined,
    types: type === 'all' ? undefined : [type],
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useNotifyOnChange(next, onChange)

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Buscar"
          placeholder="Buscar por descripción"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          className="pl-9"
        />
      </div>
      <Select
        value={type}
        onValueChange={(v) => setType(v as TransactionType | 'all')}
      >
        <SelectTrigger className="sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

import { useEffect, useRef } from 'react'

function useNotifyOnChange<T>(value: T, cb: (v: T) => void) {
  const cbRef = useRef(cb)
  cbRef.current = cb
  const lastJSON = useRef<string>('')
  useEffect(() => {
    const json = JSON.stringify(value)
    if (json !== lastJSON.current) {
      lastJSON.current = json
      cbRef.current(value)
    }
  }, [value])
}
