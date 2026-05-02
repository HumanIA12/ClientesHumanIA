import { PageWrapper } from '@/components/layout/page-wrapper'
import { ComingSoon } from '@/components/layout/coming-soon'

export default function CalendarioPage() {
  return (
    <PageWrapper title="Calendario" description="Pagos y vencimientos del mes">
      <ComingSoon phase="próxima fase" />
    </PageWrapper>
  )
}
