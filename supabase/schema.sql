-- =====================================================================
-- NEXO — Schema SQL completo
-- Ejecutar en Supabase SQL Editor (proyecto nuevo).
-- Incluye: extensiones, enums, tablas, índices, triggers, RLS y seeds.
-- =====================================================================

-- ---------- Extensiones ----------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------- Enums ----------
do $$ begin
  create type account_type as enum (
    'checking','savings','cash','credit_card','investment','loan','other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type as enum (
    'expense','income','transfer','credit_payment'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type sharing_type as enum ('shared','personal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recurrence_frequency as enum (
    'daily','weekly','biweekly','monthly','yearly'
  );
exception when duplicate_object then null; end $$;

-- ---------- Helper trigger para updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =====================================================================
-- TABLAS
-- =====================================================================

create table if not exists public.households (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  currency    text not null default 'MXN',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_households_updated on public.households;
create trigger trg_households_updated before update on public.households
  for each row execute function public.set_updated_at();

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  household_id  uuid not null references public.households(id) on delete cascade,
  display_name  text not null,
  avatar_color  text not null default '#6C63FF',
  email         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_profiles_household on public.profiles(household_id);

create table if not exists public.accounts (
  id                uuid primary key default uuid_generate_v4(),
  household_id      uuid not null references public.households(id) on delete cascade,
  name              text not null,
  type              account_type not null,
  currency          text not null default 'MXN',
  owner_profile_id  uuid references public.profiles(id) on delete set null,
  color             text not null default '#1E6B4A',
  icon              text,
  credit_limit      numeric(14,2),
  starting_balance  numeric(14,2) not null default 0,
  current_balance   numeric(14,2) not null default 0,
  is_archived       boolean not null default false,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_accounts_household on public.accounts(household_id) where deleted_at is null;
create index if not exists idx_accounts_owner on public.accounts(owner_profile_id);

drop trigger if exists trg_accounts_updated on public.accounts;
create trigger trg_accounts_updated before update on public.accounts
  for each row execute function public.set_updated_at();

create table if not exists public.categories (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  icon          text not null default 'circle',
  color         text not null default '#1E6B4A',
  parent_id     uuid references public.categories(id) on delete set null,
  kind          transaction_type not null default 'expense',
  deleted_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_categories_household on public.categories(household_id) where deleted_at is null;

create table if not exists public.recurring_rules (
  id              uuid primary key default uuid_generate_v4(),
  household_id    uuid not null references public.households(id) on delete cascade,
  name            text not null,
  account_id      uuid not null references public.accounts(id) on delete restrict,
  category_id     uuid references public.categories(id) on delete set null,
  type            transaction_type not null,
  amount          numeric(14,2) not null check (amount > 0),
  currency        text not null default 'MXN',
  frequency       recurrence_frequency not null,
  start_date      date not null,
  end_date        date,
  next_run_date   date not null,
  performed_by    uuid references public.profiles(id) on delete set null,
  sharing         sharing_type not null default 'shared',
  is_active       boolean not null default true,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_recurring_household on public.recurring_rules(household_id) where deleted_at is null;
create index if not exists idx_recurring_next on public.recurring_rules(next_run_date) where is_active and deleted_at is null;

drop trigger if exists trg_recurring_updated on public.recurring_rules;
create trigger trg_recurring_updated before update on public.recurring_rules
  for each row execute function public.set_updated_at();

create table if not exists public.installment_plans (
  id                  uuid primary key default uuid_generate_v4(),
  household_id        uuid not null references public.households(id) on delete cascade,
  account_id          uuid not null references public.accounts(id) on delete restrict,
  category_id         uuid references public.categories(id) on delete set null,
  description         text not null,
  total_amount        numeric(14,2) not null,
  installments_count  integer not null check (installments_count > 0),
  installment_amount  numeric(14,2) not null,
  currency            text not null default 'MXN',
  start_date          date not null,
  performed_by        uuid references public.profiles(id) on delete set null,
  sharing             sharing_type not null default 'shared',
  deleted_at          timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_installments_household on public.installment_plans(household_id) where deleted_at is null;

create table if not exists public.transactions (
  id                    uuid primary key default uuid_generate_v4(),
  household_id          uuid not null references public.households(id) on delete cascade,
  account_id            uuid not null references public.accounts(id) on delete restrict,
  target_account_id     uuid references public.accounts(id) on delete restrict,
  category_id           uuid references public.categories(id) on delete set null,
  type                  transaction_type not null,
  amount                numeric(14,2) not null check (amount > 0),
  currency              text not null default 'MXN',
  description           text,
  notes                 text,
  performed_at          timestamptz not null default now(),
  performed_by          uuid references public.profiles(id) on delete set null,
  registered_by         uuid not null references public.profiles(id) on delete restrict,
  sharing               sharing_type not null default 'shared',
  recurring_rule_id     uuid references public.recurring_rules(id) on delete set null,
  installment_plan_id   uuid references public.installment_plans(id) on delete set null,
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_tx_household on public.transactions(household_id) where deleted_at is null;
create index if not exists idx_tx_account on public.transactions(account_id) where deleted_at is null;
create index if not exists idx_tx_performed_at on public.transactions(performed_at desc) where deleted_at is null;
create index if not exists idx_tx_category on public.transactions(category_id) where deleted_at is null;

drop trigger if exists trg_tx_updated on public.transactions;
create trigger trg_tx_updated before update on public.transactions
  for each row execute function public.set_updated_at();

create table if not exists public.budgets (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references public.households(id) on delete cascade,
  category_id   uuid not null references public.categories(id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  amount        numeric(14,2) not null check (amount >= 0),
  currency      text not null default 'MXN',
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  unique(household_id, category_id, period_start)
);

create index if not exists idx_budgets_household on public.budgets(household_id) where deleted_at is null;

create table if not exists public.reminders (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references public.households(id) on delete cascade,
  title         text not null,
  due_date      date not null,
  amount        numeric(14,2),
  account_id    uuid references public.accounts(id) on delete set null,
  is_completed  boolean not null default false,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_reminders_household on public.reminders(household_id) where deleted_at is null;

create table if not exists public.audit_log (
  id            uuid primary key default uuid_generate_v4(),
  household_id  uuid not null references public.households(id) on delete cascade,
  actor_id      uuid not null references public.profiles(id) on delete restrict,
  entity        text not null,
  entity_id     uuid not null,
  action        text not null,
  payload       jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_audit_household on public.audit_log(household_id);
create index if not exists idx_audit_entity on public.audit_log(entity, entity_id);

create table if not exists public.attachments (
  id              uuid primary key default uuid_generate_v4(),
  household_id    uuid not null references public.households(id) on delete cascade,
  transaction_id  uuid references public.transactions(id) on delete cascade,
  storage_path    text not null,
  file_name       text not null,
  mime_type       text,
  size_bytes      bigint,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_attachments_tx on public.attachments(transaction_id) where deleted_at is null;

-- =====================================================================
-- HELPER: household_id del usuario actual
-- =====================================================================
create or replace function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.profiles where id = auth.uid()
$$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Toda fila pertenece a un household. El usuario sólo ve filas del
-- household al que pertenece su profile.
-- =====================================================================

alter table public.households       enable row level security;
alter table public.profiles         enable row level security;
alter table public.accounts         enable row level security;
alter table public.categories       enable row level security;
alter table public.transactions     enable row level security;
alter table public.recurring_rules  enable row level security;
alter table public.installment_plans enable row level security;
alter table public.budgets          enable row level security;
alter table public.reminders        enable row level security;
alter table public.audit_log        enable row level security;
alter table public.attachments      enable row level security;

-- ---- households ----
drop policy if exists "household_select" on public.households;
create policy "household_select" on public.households
  for select using (id = public.current_household_id());

drop policy if exists "household_update" on public.households;
create policy "household_update" on public.households
  for update using (id = public.current_household_id());

-- ---- profiles ----
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (household_id = public.current_household_id());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- ---- macro: aplicar políticas estándar a tablas con household_id ----
-- (Generamos manualmente — Supabase no soporta DO con CREATE POLICY de forma sencilla)

-- accounts
drop policy if exists "accounts_all" on public.accounts;
create policy "accounts_all" on public.accounts
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- categories
drop policy if exists "categories_all" on public.categories;
create policy "categories_all" on public.categories
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- transactions
drop policy if exists "transactions_all" on public.transactions;
create policy "transactions_all" on public.transactions
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- recurring_rules
drop policy if exists "recurring_all" on public.recurring_rules;
create policy "recurring_all" on public.recurring_rules
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- installment_plans
drop policy if exists "installments_all" on public.installment_plans;
create policy "installments_all" on public.installment_plans
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- budgets
drop policy if exists "budgets_all" on public.budgets;
create policy "budgets_all" on public.budgets
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- reminders
drop policy if exists "reminders_all" on public.reminders;
create policy "reminders_all" on public.reminders
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- audit_log: insert/select; nunca update/delete
drop policy if exists "audit_select" on public.audit_log;
create policy "audit_select" on public.audit_log
  for select using (household_id = public.current_household_id());

drop policy if exists "audit_insert" on public.audit_log;
create policy "audit_insert" on public.audit_log
  for insert
  with check (household_id = public.current_household_id() and actor_id = auth.uid());

-- attachments
drop policy if exists "attachments_all" on public.attachments;
create policy "attachments_all" on public.attachments
  for all
  using (household_id = public.current_household_id())
  with check (household_id = public.current_household_id());

-- =====================================================================
-- STORAGE bucket para attachments
-- (Crear bucket 'attachments' en Supabase Storage UI o vía SQL)
-- =====================================================================
insert into storage.buckets (id, name, public)
  values ('attachments', 'attachments', false)
  on conflict (id) do nothing;

-- Política: sólo miembros del household pueden leer/escribir sus archivos.
-- Convención: storage_path comienza con '<household_id>/...'
drop policy if exists "attachments_storage_select" on storage.objects;
create policy "attachments_storage_select" on storage.objects
  for select using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = public.current_household_id()::text
  );

drop policy if exists "attachments_storage_write" on storage.objects;
create policy "attachments_storage_write" on storage.objects
  for insert
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = public.current_household_id()::text
  );

drop policy if exists "attachments_storage_delete" on storage.objects;
create policy "attachments_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = public.current_household_id()::text
  );

-- =====================================================================
-- SEEDS opcionales (categorías por defecto)
-- Ejecutar manualmente después de crear el household.
-- =====================================================================
-- insert into public.categories (household_id, name, icon, color, kind) values
--   ('<HOUSEHOLD_ID>', 'Comida', 'utensils',  '#F4A823', 'expense'),
--   ('<HOUSEHOLD_ID>', 'Transporte', 'car',   '#2D9CDB', 'expense'),
--   ('<HOUSEHOLD_ID>', 'Hogar', 'home',       '#1E6B4A', 'expense'),
--   ('<HOUSEHOLD_ID>', 'Salud', 'heart',      '#E05A5A', 'expense'),
--   ('<HOUSEHOLD_ID>', 'Ocio',  'gamepad',    '#6C63FF', 'expense'),
--   ('<HOUSEHOLD_ID>', 'Sueldo','wallet',     '#27AE60', 'income');
