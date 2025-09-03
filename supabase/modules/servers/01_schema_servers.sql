-- Servidores
create table if not exists public.servers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null, -- auth.uid()
  company_name text not null,      -- Empresa
  server_name text not null,       -- Nombre del Servidor
  vpn_password text not null,      -- Contraseña VPN
  vpn_ip text not null,            -- IP VPN
  local_name text,                 -- Nombre Local
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_servers_owner on public.servers(owner_id);

drop trigger if exists trg_servers_updated_at on public.servers;
create trigger trg_servers_updated_at
before update on public.servers
for each row execute function public.set_updated_at();

-- Usuarios del servidor (múltiples)
create table if not exists public.server_users (
  id bigserial primary key,
  server_id uuid not null references public.servers(id) on delete cascade,
  username text not null,
  password text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_server_users_server on public.server_users(server_id);

drop trigger if exists trg_server_users_updated_at on public.server_users;
create trigger trg_server_users_updated_at
before update on public.server_users
for each row execute function public.set_updated_at();
