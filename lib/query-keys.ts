/**
 * Query keys centralizadas. Useamos arrays para soportar invalidación
 * jerárquica con react-query (ej. invalidar `['accounts']` invalida
 * también `['accounts', id]`).
 */
export const qk = {
  accounts: () => ['accounts'] as const,
  account: (id: string) => ['accounts', id] as const,
  householdMembers: () => ['household_members'] as const,
  transactions: (filters?: Record<string, unknown>) =>
    filters ? (['transactions', filters] as const) : (['transactions'] as const),
  recurringRules: () => ['recurring_rules'] as const,
  categories: () => ['categories'] as const,
}
