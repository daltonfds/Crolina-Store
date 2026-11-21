-- Merchant catalog + phone number collection for Crolina funnels.
create table if not exists public.banca_products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null default 'fisico' check (kind in ('fisico','digital')),
  price numeric not null default 0 check (price >= 0),
  old_price numeric not null default 0 check (old_price >= 0),
  benefits jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.banca_funnels add column if not exists product_id uuid references public.banca_products(id) on delete set null;
alter table public.banca_orders add column if not exists phone text;

create table if not exists public.banca_leads (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.banca_funnels(id) on delete cascade,
  name text,
  phone text not null,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (funnel_id, phone)
);
create index if not exists banca_leads_funnel_idx on public.banca_leads (funnel_id, created_at desc);

alter table public.banca_products enable row level security;
alter table public.banca_leads enable row level security;

create policy "owner manages own products" on public.banca_products
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "anyone reads products of published funnels" on public.banca_products
  for select to anon, authenticated
  using (exists (select 1 from public.banca_funnels f where f.product_id = banca_products.id and f.published));

create policy "owner reads own leads" on public.banca_leads
  for select to authenticated
  using (exists (select 1 from public.banca_funnels f where f.id = funnel_id and f.owner_id = auth.uid()));

create policy "owner deletes own leads" on public.banca_leads
  for delete to authenticated
  using (exists (select 1 from public.banca_funnels f where f.id = funnel_id and f.owner_id = auth.uid()));
-- Leads are inserted only by the server route (service role).
