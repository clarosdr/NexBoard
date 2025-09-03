-- Línea de presupuesto (fijo)
create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null, -- auth.uid()
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  category text not null check (category in ('vivienda','mi_hija','mamá','deudas','sueldo_1','sueldo_2')),
  due_day int not null check (due_day between 1 and 31), -- "vencimiento mensual"
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_budget_lines_owner on public.budget_lines(owner_id);

drop trigger if exists trg_budget_lines_updated_at on public.budget_lines;
create trigger trg_budget_lines_updated_at
before update on public.budget_lines
for each row execute function public.set_updated_at();

-- Pagos (marca pago por mes/año)
create table if not exists public.budget_payments (
  id bigserial primary key,
  line_id uuid not null references public.budget_lines(id) on delete cascade,
  year int not null check (year between 2000 and 2099),
  month int not null check (month between 1 and 12),
  paid boolean not null default true,
  paid_date date default current_date,
  unique (line_id, year, month)
);
create index if not exists idx_budget_payments_line on public.budget_payments(line_id);

-- Vista: estado del MES ACTUAL (America/Bogota sólo presentación)
create or replace view public.budget_status_current as
with base as (
  select
    bl.*,
    make_date(extract(year from (now() at time zone 'America/Bogota'))::int,
              extract(month from (now() at time zone 'America/Bogota'))::int,
              least(bl.due_day, 28))::date as due_date_this_month  -- evitar días 29-31 en meses cortos
  from public.budget_lines bl
),
flags as (
  select
    b.id as line_id,
    coalesce(bp.paid, false) as paid
  from base b
  left join public.budget_payments bp
    on bp.line_id = b.id
   and bp.year = extract(year from (now() at time zone 'America/Bogota'))::int
   and bp.month = extract(month from (now() at time zone 'America/Bogota'))::int
)
select
  b.*,
  f.paid,
  b.due_date_this_month,
  case
    when f.paid then 'PAGADO'
    when (b.due_date_this_month < (now() at time zone 'America/Bogota')::date) then 'VENCIDO'
    when (b.due_date_this_month <= ((now() at time zone 'America/Bogota')::date + interval '7 days')::date) then 'PROXIMO'
    else 'PENDIENTE'
  end as estado_mes
from base b
join flags f on f.line_id = b.id;
