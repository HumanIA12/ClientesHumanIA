import { Construction } from 'lucide-react'

export interface ComingSoonProps {
  phase: string
}

export function ComingSoon({ phase }: ComingSoonProps) {
  return (
    <div className="rounded-lg border border-dashed bg-card/50 p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Construction className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold">En construcción</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Esta sección llega en {phase}.
      </p>
    </div>
  )
}
