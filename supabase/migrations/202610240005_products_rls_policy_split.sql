drop policy if exists "Admins manage products" on public.products;
drop policy if exists "Public can read active products" on public.products;
create policy "Public and admins read products" on public.products for select to anon, authenticated
using ((status='Active'::public.product_status and stock_count>0) or private.is_store_admin());
create policy "Admins insert products" on public.products for insert to authenticated
with check (private.is_store_admin());
create policy "Admins update products" on public.products for update to authenticated
using (private.is_store_admin()) with check (private.is_store_admin());
create policy "Admins delete products" on public.products for delete to authenticated
using (private.is_store_admin());
