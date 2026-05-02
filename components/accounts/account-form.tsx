'use client'

import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  accountFormSchema,
  type AccountFormValues,
} from '@/lib/validation/account'
import {
  useCreateAccount,
  useUpdateAccount,
  type Account,
} from '@/hooks/use-accounts'
import { useHouseholdMembers } from '@/hooks/use-household-members'
import {
  ACCOUNT_TYPE_META,
  ACCOUNT_TYPE_ORDER,
  ACCOUNT_COLOR_PALETTE,
} from '@/lib/accounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'

const NO_OWNER_VALUE = '__none__'

export interface AccountFormProps {
  /** Si se pasa, el formulario edita esta cuenta. */
  account?: Account
}

export function AccountForm({ account }: AccountFormProps) {
  const router = useRouter()
  const { data: members } = useHouseholdMembers()
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const isEdit = !!account

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      name: account?.name ?? '',
      type: account?.type ?? 'checking',
      currency: account?.currency ?? 'MXN',
      owner_profile_id: account?.owner_profile_id ?? null,
      color: account?.color ?? ACCOUNT_TYPE_META.checking.defaultColor,
      starting_balance: account?.current_balance ?? 0,
      credit_limit: account?.credit_limit ?? null,
    },
  })

  const watchedType = form.watch('type')
  const watchedColor = form.watch('color')
  const isCredit = watchedType === 'credit_card'

  async function onSubmit(values: AccountFormValues) {
    try {
      if (isEdit && account) {
        await updateAccount.mutateAsync({
          id: account.id,
          patch: {
            name: values.name,
            type: values.type,
            currency: values.currency,
            owner_profile_id: values.owner_profile_id,
            color: values.color,
            credit_limit: isCredit ? values.credit_limit : null,
            // Nota: no tocamos starting_balance ni current_balance al editar
            // para no romper el historial. Para corregir el saldo, registra
            // un ajuste como movimiento.
          },
        })
        router.replace(`/cuentas/${account.id}`)
        router.refresh()
      } else {
        await createAccount.mutateAsync({
          name: values.name,
          type: values.type,
          currency: values.currency,
          owner_profile_id: values.owner_profile_id,
          color: values.color,
          starting_balance: values.starting_balance,
          credit_limit: isCredit ? values.credit_limit : null,
        })
        router.replace('/cuentas')
        router.refresh()
      }
    } catch (err) {
      form.setError('root', {
        message:
          err instanceof Error ? err.message : 'No se pudo guardar la cuenta',
      })
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          placeholder="BBVA Corriente, Efectivo, Visa Oro…"
          autoComplete="off"
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-danger">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type">Tipo</Label>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  const meta =
                    ACCOUNT_TYPE_META[value as keyof typeof ACCOUNT_TYPE_META]
                  if (meta && !isEdit)
                    form.setValue('color', meta.defaultColor)
                  if (value !== 'credit_card')
                    form.setValue('credit_limit', null)
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Tipo de cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_ORDER.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ACCOUNT_TYPE_META[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currency">Moneda</Label>
          <Input
            id="currency"
            maxLength={3}
            placeholder="MXN"
            {...form.register('currency')}
            onBlur={(e) => {
              form.setValue('currency', e.currentTarget.value.toUpperCase())
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="owner">Dueño</Label>
        <Controller
          control={form.control}
          name="owner_profile_id"
          render={({ field }) => (
            <Select
              value={field.value ?? NO_OWNER_VALUE}
              onValueChange={(value) =>
                field.onChange(value === NO_OWNER_VALUE ? null : value)
              }
            >
              <SelectTrigger id="owner">
                <SelectValue placeholder="¿De quién es esta cuenta?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_OWNER_VALUE}>Compartida</SelectItem>
                {(members ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Si es una cuenta que ambos manejan, déjala como compartida.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Color identificador</Label>
        <Controller
          control={form.control}
          name="color"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLOR_PALETTE.map((color) => {
                const selected =
                  field.value.toLowerCase() === color.toLowerCase()
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Color ${color}`}
                    aria-pressed={selected}
                    onClick={() => field.onChange(color)}
                    className={cn(
                      'h-9 w-9 rounded-full ring-offset-background transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      selected
                        ? 'scale-110 ring-2 ring-foreground ring-offset-2'
                        : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                  />
                )
              })}
            </div>
          )}
        />
        {form.formState.errors.color && (
          <p className="text-xs text-danger">
            {form.formState.errors.color.message}
          </p>
        )}
      </div>

      {!isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="starting_balance">
            {isCredit ? 'Saldo actual de la tarjeta' : 'Saldo inicial'}
          </Label>
          <Input
            id="starting_balance"
            type="number"
            inputMode="decimal"
            step="0.01"
            {...form.register('starting_balance')}
          />
          <p className="text-xs text-muted-foreground">
            {isCredit
              ? 'Si tienes deuda, ingrésalo como número negativo (ej. -1500).'
              : 'Lo que tienes hoy en esta cuenta. Puede ser 0.'}
          </p>
          {form.formState.errors.starting_balance && (
            <p className="text-xs text-danger">
              {form.formState.errors.starting_balance.message}
            </p>
          )}
        </div>
      )}

      {isCredit && (
        <div className="space-y-1.5">
          <Label htmlFor="credit_limit">Límite de crédito</Label>
          <Controller
            control={form.control}
            name="credit_limit"
            render={({ field }) => (
              <Input
                id="credit_limit"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={field.value ?? ''}
                onChange={(e) => {
                  const v = e.currentTarget.value
                  field.onChange(v === '' ? null : Number(v))
                }}
              />
            )}
          />
          {form.formState.errors.credit_limit && (
            <p className="text-xs text-danger">
              {form.formState.errors.credit_limit.message}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-md border p-3">
        <div
          className="h-10 w-10 shrink-0 rounded-full"
          style={{ backgroundColor: watchedColor }}
        />
        <div>
          <p className="text-sm font-medium">Vista previa</p>
          <p className="text-xs text-muted-foreground">
            {ACCOUNT_TYPE_META[watchedType].label}
          </p>
        </div>
      </div>

      {form.formState.errors.root && (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          {form.formState.errors.root.message}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={form.formState.isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEdit ? 'Guardar cambios' : 'Crear cuenta'}
        </Button>
      </div>
    </form>
  )
}
