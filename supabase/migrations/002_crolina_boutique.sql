-- Crolina boutique migration. Safe to run more than once.
-- 1) The old electronics-only category check is what blocked new products.
alter table public.products drop constraint if exists products_category_check;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists compare_at_price_zar numeric(12,2)
  check (compare_at_price_zar is null or compare_at_price_zar >= 0);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_status_idx on public.products (status);

-- 2) Customers can also see "Out of Stock" items (shown as Sold out).
drop policy if exists "Public and admins read products" on public.products;
create policy "Public and admins read products" on public.products
  for select using (status in ('Active','Out of Stock') or private.is_store_admin());

-- 3) Hardening: anonymous visitors may only read products.
revoke all on public.admin_users, public.bank_details, public.orders, public.order_items from anon;
revoke insert, update, delete, truncate, references, trigger on public.products from anon;
revoke truncate, references, trigger on public.products, public.orders,
  public.order_items, public.bank_details, public.admin_users from authenticated;

-- 4) Make yourself an admin (create the user first in Supabase > Authentication > Users).
-- Replace YOUR_ADMIN_EMAIL and run this block separately.
-- insert into public.admin_users (user_id, email)
-- select id, email from auth.users where lower(email) = lower('YOUR_ADMIN_EMAIL')
-- on conflict (user_id) do nothing;
