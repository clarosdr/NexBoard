create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null, -- auth.uid()
  client_name text not null,           -- NOMBRE DE CLIENTE
  license_name text not null,          -- NOMBRE DE LICENCIA
  serial text not null,                -- SERIAL
  install_date date not null default current_date,  -- FECHA DE INSTALACIÓN
  expiry_date date,                    -- FECHA DE EXPIRACIÓN
  max_installations int check (max_installations is null or max_installations >= 0),
  current_installations int not null default 0 check (current_installations >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  profit numeric(12,2) generated always as (
    coalesce(sale_price,0) - coalesce(cost_price,0)
  ) stored,
  provider text,                       -- PROVEEDOR
  condition text not null default 'NUEVA' check (condition in ('NUEVA','USADA')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_licenses_owner on public.licenses(owner_id);
create index if not exists idx_licenses_expiry on public.licenses(expiry_date);

drop trigger if exists trg_licenses_updated_at on public.licenses;
create trigger trg_licenses_updated_at
before update on public.licenses
for each row execute function public.set_updated_at();

-- Vista: próximas a vencer (solo nombre del cliente y fecha)
create or replace view public.licenses_due_next_30 as
select
  client_name,
  expiry_date
from public.licenses
where expiry_date is not null
  and expiry_date between (now() at time zone 'America/Bogota')::date
                      and ((now() at time zone 'America/Bogota')::date + interval '30 days')::date
order by expiry_date asc;
