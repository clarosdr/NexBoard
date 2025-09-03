alter table public.credentials enable row level security;
drop policy if exists "open_rw_credentials" on public.credentials;
drop policy if exists "credentials_select_owner" on public.credentials;
drop policy if exists "credentials_insert_owner" on public.credentials;
drop policy if exists "credentials_update_owner" on public.credentials;
drop policy if exists "credentials_delete_owner" on public.credentials;

create policy "credentials_select_owner" on public.credentials for select using (owner_id = auth.uid());
create policy "credentials_insert_owner" on public.credentials for insert with check (owner_id = auth.uid());
create policy "credentials_update_owner" on public.credentials for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "credentials_delete_owner" on public.credentials for delete using (owner_id = auth.uid());
