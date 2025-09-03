alter table public.licenses enable row level security;
drop policy if exists "open_rw_licenses" on public.licenses;
create policy "open_rw_licenses" on public.licenses for all using (true) with check (true);
