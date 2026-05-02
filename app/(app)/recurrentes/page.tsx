import { PageWrapper } from '@/components/layout/page-wrapper'
import { ComingSoon } from '@/components/layout/coming-soon'

export default function RecurrentesPage() {
  return (
    <PageWrapper title="Recurrentes" description="Pagos automáticos y suscripciones">
      <ComingSoon phase="próxima fase" />
    </PageWrapper>
  )
}
