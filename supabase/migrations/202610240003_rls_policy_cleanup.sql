-- Remove legacy exposed SECURITY DEFINER helper and consolidate overlapping policies.
drop policy if exists "Admins read bank details" on public.bank_details;
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated
using ((status='Active'::public.product_status and stock_count>0) or private.is_store_admin());
drop policy if exists "Admins manage payment proofs" on storage.objects;
create policy "Admins manage payment proofs" on storage.objects for all to authenticated
using (bucket_id='payment-proofs' and private.is_store_admin())
with check (bucket_id='payment-proofs' and private.is_store_admin());
drop policy if exists "Admins manage product images" on storage.objects;
create policy "Admins manage product images" on storage.objects for all to authenticated
using (bucket_id='product-images' and private.is_store_admin())
with check (bucket_id='product-images' and private.is_store_admin());
drop function if exists public.is_store_admin();
