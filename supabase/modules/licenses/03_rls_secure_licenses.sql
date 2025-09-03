alter table public.licenses enable row level security;
drop policy if exists "open_rw_licenses" on public.licenses;
drop policy if exists "licenses_select_owner" on public.licenses;
drop policy if exists "licenses_insert_owner" on public.licenses;
drop policy if exists "licenses_update_owner" on public.licenses;
drop policy if exists "licenses_delete_owner" on public.licenses;

create policy "licenses_select_owner" on public.licenses for select using (owner_id = auth.uid());
create policy "licenses_insert_owner" on public.licenses for insert with check (owner_id = auth.uid());
create policy "licenses_update_owner" on public.licenses for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "licenses_delete_owner" on public.licenses for delete using (owner_id = auth.uid());
