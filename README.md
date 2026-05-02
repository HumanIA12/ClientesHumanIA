# NEXO

App PWA de finanzas personales para 2 personas (pareja).

## Stack

- Next.js 14 (App Router) + TypeScript estricto
- Supabase (Auth, Postgres, RLS, Storage)
- Tailwind CSS + shadcn/ui
- Zustand (estado UI), TanStack Query (data fetching)
- Zod + React Hook Form
- date-fns, Recharts
- next-pwa

## Setup

1. Copiar variables de entorno

```bash
cp .env.example .env.local
```

Rellenar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` con los valores del proyecto Supabase.

2. Instalar dependencias

```bash
npm install
```

3. Crear el schema en Supabase

Pegar el contenido de `supabase/schema.sql` en el SQL editor del proyecto y ejecutarlo. Eso crea tablas, enums, RLS y el bucket `attachments` de Storage.

4. Generar iconos PWA (ver `public/icons/README.md`)

5. Levantar dev server

```bash
npm run dev
```

## Estructura

```
app/                     App Router (rutas, layouts, páginas)
  (auth)/                Grupo de rutas no autenticadas (login, callback)
  (app)/                 Grupo de rutas autenticadas (dashboard, cuentas, etc.)
components/              Componentes UI compartidos
lib/
  supabase/              Clients de Supabase (cliente y servidor)
  types/database.ts      Tipos del schema
  utils/                 cn, currency, balance, etc.
public/
  manifest.json          PWA manifest
  icons/                 Iconos PWA
supabase/
  schema.sql             Schema completo + RLS
```

## Reglas de negocio

- Los pagos de tarjeta (`credit_payment`) NO se cuentan como gasto en reportes.
- Disponible Seguro = saldo líquido − pagos recurrentes futuros del mes − colchón.
- Cada transacción registra `performed_by` (quién hizo el movimiento) y `registered_by` (quién lo registró).
- Soft delete siempre (`deleted_at`), nunca DELETE físico.
- Todas las queries filtran `household_id` del usuario actual (vía RLS).
