'use client'

import { useParams } from 'next/navigation'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { AccountForm } from '@/components/accounts/account-form'
import { useAccount } from '@/hooks/use-accounts'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditarCuentaPage() {
  const params = useParams<{ id: string }>()
  const { data: account, isLoading } = useAccount(params?.id)

  return (
    <PageWrapper title="Editar cuenta">
      <div className="max-w-xl">
        {isLoading ? (
          <Skeleton className="h-96 rounded-lg" />
        ) : account ? (
          <AccountForm account={account} />
        ) : (
          <p className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            Cuenta no encontrada.
          </p>
        )}
      </div>
    </PageWrapper>
  )
}
