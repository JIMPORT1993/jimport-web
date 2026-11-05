-- Ejecutar en Supabase SQL Editor DESPUÉS de CORREGIR_VENTAS_AMBIGUEDAD_DEFINITIVO.sql.
-- No elimina ventas ni inventario. Precio manual únicamente para Súper Combos.
create or replace function public.jimport_register_sale_with_combos(
 sale_items jsonb, sale_combos jsonb, sale_reference text, customer_label text default '', generate_code boolean default true
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 entry jsonb; combo_entry jsonb; combo record; part text; pid uuid; qty integer;
 total_qty integer; unit_price numeric; part_total numeric; product_price numeric;
 item_cost numeric; inv_qty integer; first_product uuid; purchase_uuid uuid; code text;
 combined jsonb := '{}'::jsonb; revenues jsonb := '{}'::jsonb; total_revenue numeric := 0;
 product_count integer := 0; component_count integer := 0; remaining integer;
begin
 if not public.jimport_is_admin() then raise exception 'Administrador no autorizado'; end if;
 if jsonb_typeof(sale_items) is distinct from 'array' or jsonb_typeof(sale_combos) is distinct from 'array' then raise exception 'Formato de venta inválido'; end if;
 if jsonb_array_length(sale_items)+jsonb_array_length(sale_combos) not between 1 and 100 then raise exception 'Selecciona entre 1 y 100 artículos'; end if;
 if length(trim(coalesce(sale_reference,''))) not between 2 and 100 then raise exception 'Referencia inválida'; end if;
 perform pg_advisory_xact_lock(hashtextextended(trim(sale_reference),0));
 if exists(select 1 from public.jimport_sales js where js.sale_reference=trim(jimport_register_sale_with_combos.sale_reference)) then raise exception 'Esta referencia ya fue registrada'; end if;
 for entry in select value from jsonb_array_elements(sale_items) t(value) loop
   pid := (entry->>'product_id')::uuid; qty := (entry->>'quantity')::integer;
   if pid is null or qty is null or qty not between 1 and 100000 then raise exception 'Cantidad individual inválida'; end if;
   select price into product_price from public.products where id=pid;
   if product_price is null then raise exception 'Producto individual no encontrado'; end if;
   combined := jsonb_set(combined,array[pid::text],to_jsonb(coalesce((combined->>pid::text)::integer,0)+qty),true);
   revenues := jsonb_set(revenues,array[pid::text],to_jsonb(coalesce((revenues->>pid::text)::numeric,0)+product_price*qty),true);
   total_revenue := total_revenue+product_price*qty;
 end loop;
 for combo_entry in select value from jsonb_array_elements(sale_combos) t(value) loop
   qty := (combo_entry->>'quantity')::integer; unit_price := (combo_entry->>'unit_price')::numeric;
   if qty is null or qty not between 1 and 100000 or unit_price is null or unit_price<=0 or unit_price>10000000 then raise exception 'Cantidad o precio manual inválido'; end if;
   select * into combo from public.jimport_super_combos where id=(combo_entry->>'combo_id')::uuid;
   if not found then raise exception 'Súper Combo no encontrado'; end if;
   if jsonb_array_length(combo.items)<2 then raise exception 'Combo sin componentes suficientes'; end if;
   select sum(coalesce(p.price,0)) into part_total from jsonb_array_elements_text(combo.items) t(id) join public.products p on p.id=t.id::uuid;
   if part_total is null or part_total<=0 or (select count(*) from jsonb_array_elements_text(combo.items)) <> (select count(*) from jsonb_array_elements_text(combo.items) t(id) join public.products p on p.id=t.id::uuid) then raise exception 'El combo contiene productos inválidos'; end if;
   for part in select value from jsonb_array_elements_text(combo.items) t(value) loop
     pid := part::uuid;
     select price into product_price from public.products where id=pid;
     combined := jsonb_set(combined,array[pid::text],to_jsonb(coalesce((combined->>pid::text)::integer,0)+qty),true);
     revenues := jsonb_set(revenues,array[pid::text],to_jsonb(coalesce((revenues->>pid::text)::numeric,0)+(unit_price*qty*product_price/part_total)),true);
     component_count := component_count+1;
   end loop;
   total_revenue := total_revenue+unit_price*qty;
 end loop;
 -- Se registra cada producto físico una sola vez por referencia, incluso si aparece en varios combos.
 for entry in select key,value from jsonb_each_text(combined) order by key loop
   pid := (entry->>'key')::uuid; total_qty := (entry->>'value')::integer;
   select quantity,landed_cost into inv_qty,item_cost from public.jimport_inventory_private where product_id=pid for update;
   if not found then raise exception 'Falta registrar inventario de producto %',pid; end if;
   if inv_qty<total_qty then raise exception 'Inventario insuficiente para producto %: quedan %',pid,inv_qty; end if;
   unit_price := round(((revenues->>pid::text)::numeric)/total_qty,2);
   insert into public.jimport_sales(product_id,sale_reference,quantity,unit_price,unit_cost,customer_label,created_by)
   values(pid,trim(sale_reference),total_qty,unit_price,item_cost,left(trim(coalesce(customer_label,'')),100),auth.uid());
   update public.jimport_inventory_private set quantity=quantity-total_qty,updated_at=now() where product_id=pid;
   remaining := inv_qty-total_qty;
   update public.products set stock=case when remaining=0 then 'Agotado' else 'En stock' end where id=pid;
   if first_product is null then first_product:=pid; end if;
   product_count:=product_count+1;
 end loop;
 if generate_code then
   code:=public.create_verified_purchase(first_product,trim(sale_reference),coalesce(customer_label,''));
   select vp.id into purchase_uuid from public.verified_purchases vp where vp.sale_reference=trim(jimport_register_sale_with_combos.sale_reference) and vp.product_id=first_product;
   for entry in select key,value from jsonb_each_text(combined) loop
     insert into public.jimport_verified_purchase_items(purchase_id,product_id,quantity)
     values(purchase_uuid,(entry->>'key')::uuid,(entry->>'value')::integer);
   end loop;
 end if;
 return jsonb_build_object('code',code,'products_count',product_count,'combo_components',component_count,'sale_total',total_revenue);
end $$;
revoke all on function public.jimport_register_sale_with_combos(jsonb,jsonb,text,text,boolean) from public,anon;
grant execute on function public.jimport_register_sale_with_combos(jsonb,jsonb,text,text,boolean) to authenticated;
notify pgrst,'reload schema';
