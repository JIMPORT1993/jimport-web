-- EJECUTA este archivo en Supabase SQL Editor tras los scripts de inventario y opiniones verificadas.
-- Una venta de varios productos genera UN solo código y UNA opinión por venta.
-- Se descuenta inventario de manera atómica, se marca Agotado al llegar a cero.
create table if not exists public.jimport_verified_purchase_items (
 purchase_id uuid not null references public.verified_purchases(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete restrict,
 quantity integer not null check(quantity>0),
 primary key(purchase_id,product_id)
);
alter table public.jimport_verified_purchase_items enable row level security;
revoke all on public.jimport_verified_purchase_items from public,anon,authenticated;

create or replace function public.jimport_register_sale_multi(
 sale_items jsonb, sale_reference text, customer_label text default '', generate_code boolean default true
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare item jsonb; product_uuid uuid; qty integer; result jsonb; one_code text := null;
 purchase_uuid uuid; first_product uuid; seen uuid[] := '{}'; remaining_qty integer;
begin
 if not public.jimport_is_admin() then raise exception 'Administrador no autorizado'; end if;
 if jsonb_typeof(sale_items) is distinct from 'array' or jsonb_array_length(sale_items) not between 1 and 100 then raise exception 'Selecciona entre 1 y 100 productos'; end if;
 if length(trim(coalesce(sale_reference,''))) not between 2 and 100 then raise exception 'Referencia inválida'; end if;
 -- Evitar dos ventas con la misma referencia, aunque sus productos sean distintos.
 perform pg_advisory_xact_lock(hashtextextended(trim(sale_reference), 0));
 if exists(select 1 from public.jimport_sales where jimport_sales.sale_reference=trim(jimport_register_sale_multi.sale_reference)) then
   raise exception 'Esta referencia de venta ya fue registrada';
 end if;
 for item in select value from jsonb_array_elements(sale_items) as t(value) loop
   product_uuid := (item->>'product_id')::uuid;
   qty := (item->>'quantity')::integer;
   if product_uuid is null or qty is null or qty < 1 or qty > 100000 then raise exception 'Producto o cantidad inválida'; end if;
   if product_uuid = any(seen) then raise exception 'Producto duplicado'; end if;
   seen := array_append(seen,product_uuid);
   if first_product is null then first_product := product_uuid; end if;
   -- La función de venta existente descuenta inventario, pero no crea códigos individuales.
   result := public.jimport_register_sale(product_uuid,sale_reference,customer_label,qty,false);
   remaining_qty := (result->>'remaining')::integer;
   update public.products set stock = case when remaining_qty=0 then 'Agotado' else 'En stock' end
     where id=product_uuid;
 end loop;
 if generate_code then
   one_code := public.create_verified_purchase(first_product,trim(sale_reference),coalesce(customer_label,''));
   select id into purchase_uuid from public.verified_purchases
    where sale_reference=trim(jimport_register_sale_multi.sale_reference) and product_id=first_product;
   for item in select value from jsonb_array_elements(sale_items) as t(value) loop
     insert into public.jimport_verified_purchase_items(purchase_id,product_id,quantity)
     values(purchase_uuid,(item->>'product_id')::uuid,(item->>'quantity')::integer);
   end loop;
 end if;
 return jsonb_build_object('code',one_code,'products_count',jsonb_array_length(sale_items));
end $$;
revoke all on function public.jimport_register_sale_multi(jsonb,text,text,boolean) from public,anon;
grant execute on function public.jimport_register_sale_multi(jsonb,text,text,boolean) to authenticated;

-- Mantener el estado público sincronizado incluso al corregir existencias manualmente.
create or replace function public.jimport_sync_stock_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 update public.products set stock=case when new.quantity<=0 then 'Agotado' else 'En stock' end
 where id=new.product_id;
 return new;
end $$;
drop trigger if exists jimport_inventory_stock_status on public.jimport_inventory_private;
create trigger jimport_inventory_stock_status after insert or update of quantity
on public.jimport_inventory_private for each row execute function public.jimport_sync_stock_status();
-- Sincronizar también existencias ya registradas.
update public.products p set stock=case when i.quantity<=0 then 'Agotado' else 'En stock' end
from public.jimport_inventory_private i where i.product_id=p.id
and p.stock is distinct from case when i.quantity<=0 then 'Agotado' else 'En stock' end;
notify pgrst,'reload schema';
