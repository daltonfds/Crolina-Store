-- Store analytics, visit journeys, and explicitly opted-in marketing contacts.
create table if not exists public.store_visitor_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  session_id text not null,
  event_type text not null check (event_type in ('page_view','product_view','add_to_cart','checkout_started','checkout_completed','cookie_accepted','exit_prompt_opened')),
  path text not null default '/',
  page_title text,
  product_id text,
  product_name text,
  referrer text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists store_visitor_events_created_idx on public.store_visitor_events(created_at desc);
create index if not exists store_visitor_events_session_idx on public.store_visitor_events(session_id, created_at desc);
create index if not exists store_visitor_events_visitor_idx on public.store_visitor_events(visitor_id, created_at desc);
alter table public.store_visitor_events enable row level security;

create table if not exists public.store_marketing_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  whatsapp text,
  source text not null default 'exit_prompt' check (source in ('cookie_consent','exit_prompt','checkout')),
  marketing_consent boolean not null default false,
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email)
);
create index if not exists store_marketing_contacts_consent_idx on public.store_marketing_contacts(marketing_consent, created_at desc);
alter table public.store_marketing_contacts enable row level security;
-- No public table policies: public writes go through validated server routes using the service role.
