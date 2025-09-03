alter table public.expenses enable row level security;
drop policy if exists "open_rw_expenses" on public.expenses;
create policy "open_rw_expenses" on public.expenses for all using (true) with check (true);
