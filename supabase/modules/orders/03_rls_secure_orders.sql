-- ORDERS
alter table public.orders enable row level security;
drop policy if exists "open_rw_orders" on public.orders;
drop policy if exists "orders_select_owner" on public.orders;
drop policy if exists "orders_insert_owner" on public.orders;
drop policy if exists "orders_update_owner" on public.orders;
drop policy if exists "orders_delete_owner" on public.orders;

create policy "orders_select_owner" on public.orders for select using (owner_id = auth.uid());
create policy "orders_insert_owner" on public.orders for insert with check (owner_id = auth.uid());
create policy "orders_update_owner" on public.orders for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "orders_delete_owner" on public.orders for delete using (owner_id = auth.uid());

-- ORDER_ITEMS (hereda dueño por join)
alter table public.order_items enable row level security;
drop policy if exists "open_rw_order_items" on public.order_items;
drop policy if exists "order_items_by_owner" on public.order_items;

create policy "order_items_by_owner" on public.order_items for all
using (exists (select 1 from public.orders o where o.id = order_id and o.owner_id = auth.uid()))
with check (exists (select 1 from public.orders o where o.id = order_id and o.owner_id = auth.uid()));

-- ORDER_PAYMENTS (hereda dueño por join)
alter table public.order_payments enable row level security;
drop policy if exists "open_rw_order_payments" on public.order_payments;
drop policy if exists "order_payments_by_owner" on public.order_payments;

create policy "order_payments_by_owner" on public.order_payments for all
using (exists (select 1 from public.orders o where o.id = order_id and o.owner_id = auth.uid()))
with check (exists (select 1 from public.orders o where o.id = order_id and o.owner_id = auth.uid()));
