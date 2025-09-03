alter table public.servers enable row level security;
drop policy if exists "open_rw_servers" on public.servers;
create policy "open_rw_servers" on public.servers for all using (true) with check (true);

alter table public.server_users enable row level security;
drop policy if exists "open_rw_server_users" on public.server_users;
create policy "open_rw_server_users" on public.server_users for all using (true) with check (true);
