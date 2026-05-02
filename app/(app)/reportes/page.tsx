'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { PageWrapper } from '@/components/layout/page-wrapper'
import { ExpensesPie } from '@/components/reports/expenses-pie'
import { MonthlyTrendChart } from '@/components/reports/monthly-trend-chart'
import { useHousehold } from '@/hooks/use-household'

export default function ReportesPage() {
  const { data: household } = useHousehold()
  const currency = household?.currency ?? 'MXN'
  const monthLabel = format(new Date(), "MMMM 'de' yyyy", { locale: es })

  return (
    <PageWrapper title="Reportes" description="Tendencias por categoría y mes">
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Gasto por categoría · {monthLabel}
          </h2>
          <ExpensesPie currency={currency} />
        </section>

        <section>
          <MonthlyTrendChart currency={currency} />
        </section>
      </div>
    </PageWrapper>
  )
}
