-- ============================================================
--  KS Facture — nouvelles tables
--  À exécuter dans Supabase > SQL Editor
-- ============================================================

-- ── 1. service_templates ─────────────────────────────────────
-- Prestations rapides sauvegardées par utilisateur

create table if not exists public.service_templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  description text not null default '',
  unit_price  numeric(12, 2) not null default 0,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.service_templates enable row level security;

create policy "Users manage own templates"
  on public.service_templates
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists service_templates_user_idx
  on public.service_templates(user_id, sort_order);

-- ── 2. expenses ──────────────────────────────────────────────
-- Dépenses manuelles pour le suivi financier

create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  amount      numeric(12, 2) not null default 0,
  expense_date date not null default current_date,
  category    text not null default 'Autre',
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users manage own expenses"
  on public.expenses
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists expenses_user_idx
  on public.expenses(user_id, expense_date desc);
