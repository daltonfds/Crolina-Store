-- Crolina funnels: each account owns conversation funnels and receives the orders they generate.
create table if not exists public.banca_funnels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  config jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banca_orders (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.banca_funnels(id) on delete cascade,
  customer_name text not null,
  city text,
  product text,
  price numeric,
  answers jsonb not null default '[]'::jsonb,
  status text not null default 'novo' check (status in ('novo','confirmado','entregue','cancelado')),
  created_at timestamptz not null default now()
);
create index if not exists banca_orders_funnel_idx on public.banca_orders (funnel_id, created_at desc);

alter table public.banca_funnels enable row level security;
alter table public.banca_orders enable row level security;

create policy "owner manages own funnels" on public.banca_funnels
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "anyone reads published funnels" on public.banca_funnels
  for select to anon, authenticated using (published = true);

create policy "owner reads own orders" on public.banca_orders
  for select to authenticated
  using (exists (select 1 from public.banca_funnels f where f.id = funnel_id and f.owner_id = auth.uid()));

create policy "owner updates own orders" on public.banca_orders
  for update to authenticated
  using (exists (select 1 from public.banca_funnels f where f.id = funnel_id and f.owner_id = auth.uid()))
  with check (exists (select 1 from public.banca_funnels f where f.id = funnel_id and f.owner_id = auth.uid()));
-- No insert policy on purpose: orders are created only by the server route (service role).
