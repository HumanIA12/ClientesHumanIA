/**
 * Formatea un monto con su moneda usando el locale del navegador.
 * Por defecto usa locale 'es-MX' y 2 decimales.
 *
 * @param amount monto numérico (en unidades, no centavos)
 * @param currency código ISO 4217, ej. 'MXN', 'USD'
 * @param locale locale BCP 47, default 'es-MX'
 */
export function formatCurrency(
  amount: number,
  currency = 'MXN',
  locale = 'es-MX'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formato compacto: $1.2k, $34.5k, $1.2M.
 * Útil en widgets y gráficas.
 */
export function formatCurrencyCompact(
  amount: number,
  currency = 'MXN',
  locale = 'es-MX'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

/**
 * Parsea una entrada de usuario tipo "1.234,56" o "1,234.56" a number.
 * Retorna NaN si no es válido.
 */
export function parseCurrencyInput(input: string): number {
  const cleaned = input.trim().replace(/[^\d.,-]/g, '')
  if (!cleaned) return NaN
  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  let normalized = cleaned
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = cleaned.replace(/,/g, '')
  }
  const value = Number(normalized)
  return Number.isFinite(value) ? value : NaN
}
