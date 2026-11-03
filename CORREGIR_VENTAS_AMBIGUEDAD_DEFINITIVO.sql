-- Ejecutar una sola vez en Supabase SQL Editor. No borra registros.
-- Corrige referencias ambiguas en ventas individuales y múltiples.

-- Corrección del error: column reference "sale_reference" is ambiguous.
-- Ejecutar en Supabase SQL Editor. No elimina datos ni reinicia inventario.
create or replace function public.jimport_register_sale(
 sold_product_id uuid, sale_reference text, customer_label text default '',
 sold_quantity integer default 1, generate_code boolean default true
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare inv record; sale_price numeric(12,2); code text := null;
begin
 if not public.jimport_is_admin() then raise exception 'Administrador no autorizado'; end if;
 if sold_quantity is null or sold_quantity<1 or sold_quantity>100000 then raise exception 'Cantidad inválida'; end if;
 if length(trim(coalesce(sale_reference,''))) not between 2 and 100 then raise exception 'Referencia inválida'; end if;
 if exists(select 1 from public.jimport_sales js where js.product_id=sold_product_id and js.sale_reference=trim(jimport_register_sale.sale_reference)) then raise exception 'Venta ya registrada para esta referencia y producto'; end if;
 select quantity,landed_cost into inv from public.jimport_inventory_private where product_id=sold_product_id for update;
 if not found then raise exception 'Primero registra el inventario del producto'; end if;
 if inv.quantity<sold_quantity then raise exception 'Stock insuficiente: quedan % unidades', inv.quantity; end if;
 -- La restricción UNIQUE también evita duplicados en operaciones simultáneas.
 select price into sale_price from public.products where id=sold_product_id;
 if sale_price is null then raise exception 'Producto inexistente'; end if;
 insert into public.jimport_sales(product_id,sale_reference,quantity,unit_price,unit_cost,customer_label,created_by)
 values(sold_product_id,trim(sale_reference),sold_quantity,sale_price,inv.landed_cost,left(trim(coalesce(customer_label,'')),100),auth.uid());
 update public.jimport_inventory_private set quantity=quantity-sold_quantity,updated_at=now() where product_id=sold_product_id;
 if generate_code then
   -- Se usa la función existente de compras verificadas; cualquier error revierte toda la venta.
   code := public.create_verified_purchase(sold_product_id,trim(sale_reference),coalesce(customer_label,''));
 end if;
 return jsonb_build_object('code',code,'quantity',sold_quantity,'remaining',inv.quantity-sold_quantity);
end $$;

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
 if exists(select 1 from public.jimport_sales js where js.sale_reference=trim(jimport_register_sale_multi.sale_reference)) then
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
   select id into purchase_uuid from public.verified_purchases vp
    where vp.sale_reference=trim(jimport_register_sale_multi.sale_reference) and vp.product_id=first_product;
   for item in select value from jsonb_array_elements(sale_items) as t(value) loop
     insert into public.jimport_verified_purchase_items(purchase_id,product_id,quantity)
     values(purchase_uuid,(item->>'product_id')::uuid,(item->>'quantity')::integer);
   end loop;
 end if;
 return jsonb_build_object('code',one_code,'products_count',jsonb_array_length(sale_items));
end $$;

notify pgrst, 'reload schema';
