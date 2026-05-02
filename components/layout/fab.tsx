import Link from 'next/link'
import { Plus } from 'lucide-react'

/**
 * FAB de "nuevo movimiento" para tablet/desktop. En móvil el equivalente
 * vive como botón central elevado dentro del BottomNav, así que aquí lo
 * ocultamos en pantallas pequeñas para no duplicar.
 */
export function Fab() {
  return (
    <Link
      href="/movimientos/nuevo"
      aria-label="Nuevo movimiento"
      className="fixed bottom-8 right-8 z-30 hidden h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 lg:inline-flex"
    >
      <Plus className="h-6 w-6" />
    </Link>
  )
}
