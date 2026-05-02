import { z } from 'zod'

export const accountTypeSchema = z.enum([
  'checking',
  'savings',
  'cash',
  'credit_card',
  'investment',
  'loan',
  'other',
])

export const accountFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .max(50, 'Máximo 50 caracteres'),
    type: accountTypeSchema,
    currency: z.string().min(3).max(3).default('MXN'),
    owner_profile_id: z.string().uuid().nullable(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/i, 'Color inválido'),
    starting_balance: z.coerce
      .number()
      .refine((v) => Number.isFinite(v), 'Monto inválido'),
    credit_limit: z
      .union([z.coerce.number().positive('Debe ser mayor a 0'), z.null()])
      .nullable(),
  })
  .refine(
    (data) =>
      data.type !== 'credit_card' ||
      data.credit_limit === null ||
      data.credit_limit > 0,
    {
      message: 'Las tarjetas de crédito requieren un límite válido',
      path: ['credit_limit'],
    }
  )

export type AccountFormValues = z.infer<typeof accountFormSchema>
