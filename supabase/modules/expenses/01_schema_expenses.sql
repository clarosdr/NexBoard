create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null, -- auth.uid()
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null check (category in ('vivienda','mi_hija','mama','sueldo','sueldo2','otros')),
  expense_date date not null default current_date,
  detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expenses_owner on public.expenses(owner_id);
create index if not exists idx_expenses_category on public.expenses(category);
create index if not exists idx_expenses_date on public.expenses(expense_date);

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();
