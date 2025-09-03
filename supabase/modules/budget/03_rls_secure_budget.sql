-- LÍNEAS
alter table public.budget_lines enable row level security;
drop policy if exists "open_rw_budget_lines" on public.budget_lines;
drop policy if exists "budget_lines_select_owner" on public.budget_lines;
drop policy if exists "budget_lines_insert_owner" on public.budget_lines;
drop policy if exists "budget_lines_update_owner" on public.budget_lines;
drop policy if exists "budget_lines_delete_owner" on public.budget_lines;

create policy "budget_lines_select_owner" on public.budget_lines for select using (owner_id = auth.uid());
create policy "budget_lines_insert_owner" on public.budget_lines for insert with check (owner_id = auth.uid());
create policy "budget_lines_update_owner" on public.budget_lines for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "budget_lines_delete_owner" on public.budget_lines for delete using (owner_id = auth.uid());

-- PAGOS
alter table public.budget_payments enable row level security;
drop policy if exists "open_rw_budget_payments" on public.budget_payments;
drop policy if exists "budget_payments_by_owner" on public.budget_payments;

create policy "budget_payments_by_owner" on public.budget_payments for all
using (exists (select 1 from public.budget_lines bl where bl.id = line_id and bl.owner_id = auth.uid()))
with check (exists (select 1 from public.budget_lines bl where bl.id = line_id and bl.owner_id = auth.uid()));
