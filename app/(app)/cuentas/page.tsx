import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { Button } from '@/components/ui/button'
import { AccountList } from '@/components/accounts/account-list'

export default function CuentasPage() {
  return (
    <PageWrapper
      title="Cuentas"
      description="Bancos, efectivo, tarjetas e inversiones"
      actions={
        <Button asChild>
          <Link href="/cuentas/nueva">
            <Plus className="mr-2 h-4 w-4" />
            Nueva cuenta
          </Link>
        </Button>
      }
    >
      <AccountList />
    </PageWrapper>
  )
}
