'use client'

import { useParams } from 'next/navigation'
import { useTransactionQuery } from '@/hooks/use-transactions'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditarMovimientoPage() {
  const params = useParams<{ id: string }>()
  const { data: tx, isLoading } = useTransactionQuery(params?.id)

  return (
    <PageWrapper title="Editar movimiento">
      <div className="max-w-xl">
        {isLoading ? (
          <Skeleton className="h-96 rounded-lg" />
        ) : tx ? (
          <TransactionForm transaction={tx} />
        ) : (
          <p className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            Movimiento no encontrado.
          </p>
        )}
      </div>
    </PageWrapper>
  )
}
