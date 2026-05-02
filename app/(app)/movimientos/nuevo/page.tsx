import { PageWrapper } from '@/components/layout/page-wrapper'
import { TransactionForm } from '@/components/transactions/transaction-form'

export default function NuevoMovimientoPage() {
  return (
    <PageWrapper
      title="Nuevo movimiento"
      description="Registra un gasto, ingreso, transferencia o pago de tarjeta"
    >
      <div className="max-w-xl">
        <TransactionForm />
      </div>
    </PageWrapper>
  )
}
