'use client'

import { useEffect, useState } from 'react'
import { Loader2, Save, Sparkles } from 'lucide-react'
import {
  useHousehold,
  useUpdateHousehold,
  useSeedDefaultCategories,
} from '@/hooks/use-household'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Ajustes del hogar: nombre, moneda y colchón mínimo (safe_buffer).
 * El colchón se resta del Disponible Seguro en el dashboard para
 * proteger un mínimo intocable cada mes.
 */
export function HouseholdSettings() {
  const { data: household, isLoading } = useHousehold()
  const update = useUpdateHousehold()
  const seedCategories = useSeedDefaultCategories()

  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('MXN')
  const [buffer, setBuffer] = useState('0')
  const [seedMessage, setSeedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!household) return
    setName(household.name)
    setCurrency(household.currency)
    setBuffer(String(household.safe_buffer ?? 0))
  }, [household])

  if (isLoading) return <Skeleton className="h-64 rounded-lg" />
  if (!household) {
    return (
      <p className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
        No encontramos tu household. Asegúrate de que tu profile tenga
        household_id asignado.
      </p>
    )
  }

  async function handleSave() {
    setError(null)
    const numBuffer = Number(buffer)
    if (!Number.isFinite(numBuffer) || numBuffer < 0) {
      setError('El colchón debe ser un número ≥ 0')
      return
    }
    if (currency.length !== 3) {
      setError('La moneda debe tener 3 letras (MXN, USD, EUR…)')
      return
    }
    try {
      await update.mutateAsync({
        id: household!.id,
        patch: {
          name: name.trim(),
          currency: currency.toUpperCase(),
          safe_buffer: numBuffer,
        },
      })
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  async function handleSeed() {
    setSeedMessage(null)
    try {
      const inserted = await seedCategories.mutateAsync()
      setSeedMessage(
        inserted === 0
          ? 'Tus categorías ya estaban completas. Nada nuevo.'
          : `Listo. Se crearon ${inserted} categorías por defecto.`
      )
    } catch (err) {
      setSeedMessage(
        err instanceof Error ? err.message : 'No se pudo cargar el seed'
      )
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="hh-name">Nombre del hogar</Label>
        <Input
          id="hh-name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Casa Pérez"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="hh-currency">Moneda</Label>
          <Input
            id="hh-currency"
            maxLength={3}
            value={currency}
            onChange={(e) =>
              setCurrency(e.currentTarget.value.toUpperCase())
            }
            placeholder="MXN"
          />
          <p className="text-xs text-muted-foreground">
            Código ISO 4217 de 3 letras.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hh-buffer">Colchón mínimo</Label>
          <Input
            id="hh-buffer"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={buffer}
            onChange={(e) => setBuffer(e.currentTarget.value)}
          />
          <p className="text-xs text-muted-foreground">
            Se resta del Disponible Seguro como reserva intocable.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar
        </Button>
        {savedAt && Date.now() - savedAt < 4000 && (
          <span className="text-xs text-success">Guardado</span>
        )}
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold">Categorías por defecto</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Crea automáticamente un set de categorías comunes (comida, súper,
          servicios, sueldo…). Si ya tienes algunas con los mismos nombres,
          no se duplican.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={handleSeed}
          disabled={seedCategories.isPending}
        >
          {seedCategories.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Cargar categorías sugeridas
        </Button>
        {seedMessage && (
          <p className="mt-2 text-xs text-muted-foreground">{seedMessage}</p>
        )}
      </div>
    </div>
  )
}
