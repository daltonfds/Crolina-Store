drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated
using (status='Active'::public.product_status and stock_count>0);

create or replace function public.set_store_order_status(p_order_id uuid,p_status public.order_status)
returns public.orders
language plpgsql
security definer
set search_path=''
as $$
declare v_order public.orders;
declare v_item record;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if p_status='cancelled' and v_order.status in ('pending_payment','proof_submitted') then
    for v_item in select product_id,quantity from public.order_items where order_id=v_order.id and product_id is not null
    loop
      update public.products set stock_count=stock_count+v_item.quantity,
        status=case when status='Out of Stock' then 'Active'::public.product_status else status end,
        updated_at=now()
      where id=v_item.product_id;
    end loop;
  end if;
  update public.orders set status=p_status,updated_at=now() where id=p_order_id returning * into v_order;
  return v_order;
end;
$$;
revoke all on function public.set_store_order_status(uuid,public.order_status) from public,anon,authenticated;
grant execute on function public.set_store_order_status(uuid,public.order_status) to service_role;
