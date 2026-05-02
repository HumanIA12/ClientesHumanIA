'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button } from '@/components/ui/button'
import { TransactionList } from '@/components/transactions/transaction-list'
import { TransactionFiltersBar } from '@/components/transactions/transaction-filters'
import type { TransactionFilters } from '@/hooks/use-transactions'

export default function MovimientosPage() {
  const [filters, setFilters] = useState<TransactionFilters>({})

  return (
    <PageWrapper
      title="Movimientos"
      description="Gastos, ingresos y transferencias"
      actions={
        <Button asChild>
          <Link href="/movimientos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Link>
        </Button>
      }
    >
      <div className="space-y-5">
        <TransactionFiltersBar onChange={setFilters} />
        <TransactionList filters={filters} />
      </div>
    </PageWrapper>
  )
}
