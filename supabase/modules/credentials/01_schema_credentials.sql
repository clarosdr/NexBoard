create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null, -- auth.uid()
  site_app text not null,
  username text not null,
  password text not null,     -- (opcional: cifrar con pgcrypto en otra iteración)
  category text not null check (category in ('personal','bancos','principal','entretenimiento','otros')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_credentials_owner on public.credentials(owner_id);

drop trigger if exists trg_credentials_updated_at on public.credentials;
create trigger trg_credentials_updated_at
before update on public.credentials
for each row execute function public.set_updated_at();
