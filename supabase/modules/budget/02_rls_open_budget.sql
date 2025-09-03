alter table public.budget_lines enable row level security;
drop policy if exists "open_rw_budget_lines" on public.budget_lines;
create policy "open_rw_budget_lines" on public.budget_lines for all using (true) with check (true);

alter table public.budget_payments enable row level security;
drop policy if exists "open_rw_budget_payments" on public.budget_payments;
create policy "open_rw_budget_payments" on public.budget_payments for all using (true) with check (true);
