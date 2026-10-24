alter table public.orders add column if not exists customer_user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_customer_user_created_idx on public.orders(customer_user_id,created_at desc) where customer_user_id is not null;
drop function if exists public.create_store_order(text,text,text,jsonb,public.payment_method,text,text,jsonb,numeric);
create function public.create_store_order(
  p_customer_name text,p_customer_email text,p_customer_phone text,p_shipping_address jsonb,
  p_payment_method public.payment_method,p_payment_link_url text,p_customer_notes text,p_items jsonb,
  p_shipping_zar numeric default 0,p_customer_user_id uuid default null
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_order public.orders;
declare v_item jsonb;
declare v_product public.products;
declare v_qty integer;
declare v_subtotal numeric(12,2):=0;
begin
  if length(trim(coalesce(p_customer_name,'')))<2 or length(trim(coalesce(p_customer_email,'')))<5 or length(trim(coalesce(p_customer_phone,'')))<5 then raise exception 'Customer name, email and phone are required'; end if;
  if jsonb_typeof(p_shipping_address)<>'object' or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>20 then raise exception 'Invalid shipping address or cart'; end if;
  if p_shipping_zar<0 or p_shipping_zar>1000 then raise exception 'Invalid shipping amount'; end if;
  for v_item in select value from jsonb_array_elements(p_items) order by (value->>'product_id')
  loop
    v_qty:=(v_item->>'quantity')::integer;
    if v_qty<1 or v_qty>10 then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid and status='Active' for update;
    if not found then raise exception 'Product unavailable'; end if;
    if v_product.stock_count<v_qty then raise exception 'Insufficient stock for %',v_product.name; end if;
    v_subtotal:=v_subtotal+(v_product.price_zar*v_qty);
  end loop;
  insert into public.orders(customer_user_id,customer_name,customer_email,customer_phone,shipping_address,payment_method,payment_link_url,status,subtotal_zar,shipping_zar,customer_notes)
  values(p_customer_user_id,trim(p_customer_name),lower(trim(p_customer_email)),trim(p_customer_phone),p_shipping_address,p_payment_method,
    case when p_payment_method='payment_link' then nullif(trim(coalesce(p_payment_link_url,'')),'') else null end,
    'pending_payment',v_subtotal,p_shipping_zar,nullif(trim(coalesce(p_customer_notes,'')),''))
  returning * into v_order;
  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_qty:=(v_item->>'quantity')::integer;
    select * into v_product from public.products where id=(v_item->>'product_id')::uuid for update;
    insert into public.order_items(order_id,product_id,product_name,product_slug,unit_price_zar,quantity) values(v_order.id,v_product.id,v_product.name,v_product.slug,v_product.price_zar,v_qty);
    update public.products set stock_count=stock_count-v_qty,status=case when stock_count-v_qty<=0 then 'Out of Stock'::public.product_status else status end,updated_at=now() where id=v_product.id;
  end loop;
  return jsonb_build_object('id',v_order.id,'order_reference',v_order.order_reference,'total_zar',v_order.total_zar,'payment_method',v_order.payment_method,'payment_link_url',v_order.payment_link_url,'status',v_order.status);
end;$$;
revoke all on function public.create_store_order(text,text,text,jsonb,public.payment_method,text,text,jsonb,numeric,uuid) from public,anon,authenticated;
grant execute on function public.create_store_order(text,text,text,jsonb,public.payment_method,text,text,jsonb,numeric,uuid) to service_role;
