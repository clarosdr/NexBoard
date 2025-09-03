alter table public.credentials enable row level security;
drop policy if exists "open_rw_credentials" on public.credentials;
create policy "open_rw_credentials" on public.credentials for all using (true) with check (true);
