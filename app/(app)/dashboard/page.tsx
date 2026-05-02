import { PageWrapper } from '@/components/layout/page-wrapper'

export default function DashboardPage() {
  return (
    <PageWrapper
      title="Inicio"
      description="Resumen de tus finanzas en pareja"
    >
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <p className="text-sm text-muted-foreground">
          Dashboard placeholder — se implementa en Fase 6.
        </p>
      </div>
    </PageWrapper>
  )
}
