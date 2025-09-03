alter table public.expenses enable row level security;
drop policy if exists "open_rw_expenses" on public.expenses;
drop policy if exists "expenses_select_owner" on public.expenses;
drop policy if exists "expenses_insert_owner" on public.expenses;
drop policy if exists "expenses_update_owner" on public.expenses;
drop policy if exists "expenses_delete_owner" on public.expenses;

create policy "expenses_select_owner" on public.expenses for select using (owner_id = auth.uid());
create policy "expenses_insert_owner" on public.expenses for insert with check (owner_id = auth.uid());
create policy "expenses_update_owner" on public.expenses for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "expenses_delete_owner" on public.expenses for delete using (owner_id = auth.uid());
