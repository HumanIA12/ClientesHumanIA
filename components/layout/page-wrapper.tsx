import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface PageWrapperProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Contenedor estándar para el contenido de cada página.
 * Maneja el ancho máximo, padding responsive y un encabezado opcional.
 */
export function PageWrapper({
  title,
  description,
  actions,
  children,
  className,
}: PageWrapperProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-6xl px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8',
        className
      )}
    >
      {(title || actions) && (
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </div>
  )
}
