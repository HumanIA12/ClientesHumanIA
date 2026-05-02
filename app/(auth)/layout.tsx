import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4 safe-top safe-bottom">
      {children}
    </main>
  )
}
