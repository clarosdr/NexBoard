-- Tabla principal
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null, -- auth.uid()
  customer_name text not null,
  service_date date not null default current_date,
  description text not null,
  status text not null default 'PENDIENTE' check (status in ('PENDIENTE','EN PROCESO','FINALIZADO','ENTREGADO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_owner on public.orders(owner_id);
create index if not exists idx_orders_status on public.orders(status);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- Items de venta
create table if not exists public.order_items (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  quantity numeric(12,2) not null check (quantity > 0),
  item_desc text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  part_cost numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

drop trigger if exists trg_order_items_updated_at on public.order_items;
create trigger trg_order_items_updated_at
before update on public.order_items
for each row execute function public.set_updated_at();

-- Pagos (múltiples métodos)
create table if not exists public.order_payments (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  pay_date date not null default current_date,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('efectivo','transferencia','tarjeta','cheque','otros')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_order_payments_order_id on public.order_payments(order_id);

drop trigger if exists trg_order_payments_updated_at on public.order_payments;
create trigger trg_order_payments_updated_at
before update on public.order_payments
for each row execute function public.set_updated_at();

-- VISTAS financieras (subtotal, totales, ganancias, saldo)
create or replace view public.order_items_view as
select
  oi.*,
  (oi.quantity * oi.unit_price) as subtotal,
  (oi.quantity * oi.part_cost)  as cost_total_item
from public.order_items oi;

create or replace view public.order_financials as
select
  o.id as order_id,
  o.customer_name,
  o.status,
  coalesce(sum(iv.subtotal), 0) as total,
  coalesce(sum(iv.cost_total_item), 0) as costo_total,
  coalesce(sum(iv.subtotal), 0) - coalesce(sum(iv.cost_total_item), 0) as ganancia,
  coalesce( (select sum(p.amount) from public.order_payments p where p.order_id = o.id), 0) as total_pagado,
  (coalesce(sum(iv.subtotal), 0) - coalesce( (select sum(p.amount) from public.order_payments p where p.order_id = o.id), 0)) as saldo_pendiente
from public.orders o
left join public.order_items_view iv on iv.order_id = o.id
group by o.id, o.customer_name, o.status;
