import { PageWrapper } from '@/components/layout/page-wrapper'
import { SafeAvailableWidget } from '@/components/dashboard/safe-available-widget'
import { TotalBalanceWidget } from '@/components/dashboard/total-balance-widget'
import { MonthSummaryWidget } from '@/components/dashboard/month-summary-widget'
import { UpcomingPayments } from '@/components/dashboard/upcoming-payments'
import { CoupleBalanceWidget } from '@/components/dashboard/couple-balance-widget'
import { RecentTransactionsWidget } from '@/components/dashboard/recent-transactions-widget'

export default function DashboardPage() {
  return (
    <PageWrapper
      title="Inicio"
      description="Resumen de tus finanzas en pareja"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><SafeAvailableWidget /></div>
        <TotalBalanceWidget />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MonthSummaryWidget />
        <CoupleBalanceWidget />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <UpcomingPayments />
        <RecentTransactionsWidget />
      </div>
    </PageWrapper>
  )
}
