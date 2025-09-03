-- RLS activado + abierto temporalmente
alter table public.orders enable row level security;
drop policy if exists "open_rw_orders" on public.orders;
create policy "open_rw_orders" on public.orders for all using (true) with check (true);

alter table public.order_items enable row level security;
drop policy if exists "open_rw_order_items" on public.order_items;
create policy "open_rw_order_items" on public.order_items for all using (true) with check (true);

alter table public.order_payments enable row level security;
drop policy if exists "open_rw_order_payments" on public.order_payments;
create policy "open_rw_order_payments" on public.order_payments for all using (true) with check (true);
