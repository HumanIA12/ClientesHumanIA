import { PageWrapper } from '@/components/layout/page-wrapper'
import { AccountForm } from '@/components/accounts/account-form'

export default function NuevaCuentaPage() {
  return (
    <PageWrapper
      title="Nueva cuenta"
      description="Banco, efectivo, tarjeta o inversión"
    >
      <div className="max-w-xl">
        <AccountForm />
      </div>
    </PageWrapper>
  )
}
