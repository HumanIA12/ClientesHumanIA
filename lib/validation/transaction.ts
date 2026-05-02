import { z } from 'zod'

export const transactionTypeSchema = z.enum([
  'expense',
  'income',
  'transfer',
  'credit_payment',
])

const baseFields = {
  amount: z.coerce
    .number()
    .positive('El monto debe ser mayor a 0')
    .finite('Monto inválido'),
  account_id: z.string().uuid('Selecciona una cuenta'),
  performed_at: z
    .string()
    .min(1, 'Fecha requerida')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'Fecha inválida'),
  description: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  performed_by: z.string().uuid('Selecciona quién pagó').nullable(),
  sharing: z.enum(['shared', 'personal']),
  currency: z.string().min(3).max(3).default('MXN'),
}

const expenseSchema = z.object({
  ...baseFields,
  type: z.literal('expense'),
  category_id: z.string().uuid('Selecciona una categoría'),
  target_account_id: z.null().optional(),
})

const incomeSchema = z.object({
  ...baseFields,
  type: z.literal('income'),
  category_id: z.string().uuid().nullable(),
  target_account_id: z.null().optional(),
})

const transferSchema = z
  .object({
    ...baseFields,
    type: z.literal('transfer'),
    category_id: z.null().optional(),
    target_account_id: z.string().uuid('Selecciona la cuenta destino'),
  })
  .refine((d) => d.account_id !== d.target_account_id, {
    message: 'Origen y destino no pueden ser la misma cuenta',
    path: ['target_account_id'],
  })

const creditPaymentSchema = z
  .object({
    ...baseFields,
    type: z.literal('credit_payment'),
    category_id: z.null().optional(),
    target_account_id: z.string().uuid('Selecciona la tarjeta a pagar'),
  })
  .refine((d) => d.account_id !== d.target_account_id, {
    message: 'Origen y tarjeta no pueden ser la misma cuenta',
    path: ['target_account_id'],
  })

export const transactionFormSchema = z.union([
  expenseSchema,
  incomeSchema,
  transferSchema,
  creditPaymentSchema,
])

export type TransactionFormValues = z.infer<typeof transactionFormSchema>
