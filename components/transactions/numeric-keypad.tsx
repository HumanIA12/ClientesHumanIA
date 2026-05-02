'use client'

import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/currency'

export interface NumericKeypadProps {
  /** Valor en string (lo que muestra el display, ej. "1234.56"). */
  value: string
  onChange: (next: string) => void
  /** Código ISO de la moneda; sólo afecta el formato del display. */
  currency?: string
  /** Texto de moneda mostrado bajo el monto (ej. "MXN"). */
  className?: string
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

/**
 * Teclado numérico grande estilo POS: dígitos 0-9, punto decimal y
 * borrar. Mantiene el monto como string y aplica reglas:
 * - sin múltiples puntos
 * - máximo 2 decimales
 * - el primer dígito reemplaza a "0"
 */
export function NumericKeypad({
  value,
  onChange,
  currency = 'MXN',
  className,
}: NumericKeypadProps) {
  function handleDigit(d: string) {
    if (value === '0') {
      onChange(d)
      return
    }
    if (value.includes('.')) {
      const [, decimals = ''] = value.split('.')
      if (decimals.length >= 2) return
    }
    onChange(value + d)
  }

  function handleDot() {
    if (value.includes('.')) return
    onChange((value || '0') + '.')
  }

  function handleDelete() {
    if (value.length <= 1) {
      onChange('0')
      return
    }
    onChange(value.slice(0, -1))
  }

  const numeric = Number(value) || 0
  const display = formatCurrency(numeric, currency)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border bg-muted/40 px-4 py-6 text-center"
      >
        <p className="text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
          {display}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          {currency}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {DIGITS.map((d) => (
          <KeyButton key={d} onClick={() => handleDigit(d)}>
            {d}
          </KeyButton>
        ))}
        <KeyButton onClick={handleDot}>.</KeyButton>
        <KeyButton onClick={() => handleDigit('0')}>0</KeyButton>
        <KeyButton onClick={handleDelete} aria-label="Borrar último dígito">
          <Delete className="mx-auto h-5 w-5" />
        </KeyButton>
      </div>
    </div>
  )
}

function KeyButton({
  onClick,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-14 select-none rounded-lg border bg-card text-2xl font-semibold tabular-nums shadow-sm transition-transform hover:bg-muted active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      {...rest}
    >
      {children}
    </button>
  )
}
