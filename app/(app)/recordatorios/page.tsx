import { PageWrapper } from '@/components/layout/page-wrapper'
import { ComingSoon } from '@/components/layout/coming-soon'

export default function RecordatoriosPage() {
  return (
    <PageWrapper title="Recordatorios" description="Vencimientos por revisar">
      <ComingSoon phase="próxima fase" />
    </PageWrapper>
  )
}
