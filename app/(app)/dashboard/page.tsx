import { createServerClient } from '@/lib/supabase/server'
import { SignOutButton } from './sign-out-button'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Bienvenida/o</p>
          <h1 className="text-2xl font-bold">{user?.email}</h1>
        </div>
        <SignOutButton />
      </header>
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <p className="text-sm text-muted-foreground">
          Dashboard placeholder — se implementa en Fase 6.
        </p>
      </div>
    </div>
  )
}
