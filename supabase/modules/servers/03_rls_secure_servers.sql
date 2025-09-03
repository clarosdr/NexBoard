-- SERVERS
alter table public.servers enable row level security;
drop policy if exists "open_rw_servers" on public.servers;
drop policy if exists "servers_select_owner" on public.servers;
drop policy if exists "servers_insert_owner" on public.servers;
drop policy if exists "servers_update_owner" on public.servers;
drop policy if exists "servers_delete_owner" on public.servers;

create policy "servers_select_owner" on public.servers for select using (owner_id = auth.uid());
create policy "servers_insert_owner" on public.servers for insert with check (owner_id = auth.uid());
create policy "servers_update_owner" on public.servers for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "servers_delete_owner" on public.servers for delete using (owner_id = auth.uid());

-- SERVER_USERS (hereda dueño por join)
alter table public.server_users enable row level security;
drop policy if exists "open_rw_server_users" on public.server_users;
drop policy if exists "server_users_by_owner" on public.server_users;

create policy "server_users_by_owner" on public.server_users for all
using (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()))
with check (exists (select 1 from public.servers s where s.id = server_id and s.owner_id = auth.uid()));
