-- JIMPORT: eliminar una venta completa y devolver sus unidades al inventario.
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor.
-- Operación atómica: si falla cualquier reintegro, no se elimina la venta.
create or replace function public.jimport_delete_sale_restore_inventory(p_sale_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare sale_row record; restored_products integer := 0; restored_units integer := 0; deleted_rows integer := 0;
begin
 if not public.jimport_is_admin() then raise exception 'Administrador no autorizado'; end if;
 if length(trim(coalesce(p_sale_reference,''))) not between 2 and 100 then raise exception 'Referencia de venta inválida'; end if;
 perform pg_advisory_xact_lock(hashtextextended(trim(p_sale_reference),0));
 if not exists(select 1 from public.jimport_sales where sale_reference=trim(p_sale_reference)) then
   raise exception 'No se encontró una venta con esa referencia; no se modificó el inventario';
 end if;
 for sale_row in
   select product_id, sum(quantity)::integer as quantity
   from public.jimport_sales where sale_reference=trim(p_sale_reference)
   group by product_id order by product_id
 loop
   perform 1 from public.jimport_inventory_private where product_id=sale_row.product_id for update;
   if not found then raise exception 'No existe inventario para el producto %. No se eliminó la venta',sale_row.product_id; end if;
   update public.jimport_inventory_private set quantity=quantity+sale_row.quantity, updated_at=now() where product_id=sale_row.product_id;
   if not found then raise exception 'No se pudo reintegrar el producto %. No se eliminó la venta',sale_row.product_id; end if;
   restored_products:=restored_products+1; restored_units:=restored_units+sale_row.quantity;
 end loop;
 update public.verified_purchases set expires_at=least(expires_at,now()) where sale_reference=trim(p_sale_reference) and redeemed_at is null;
 delete from public.jimport_sales where sale_reference=trim(p_sale_reference);
 get diagnostics deleted_rows=row_count;
 return jsonb_build_object('sale_reference',trim(p_sale_reference),'products_count',restored_products,'units_restored',restored_units,'sale_rows_deleted',deleted_rows);
end;
$$;
revoke all on function public.jimport_delete_sale_restore_inventory(text) from public,anon;
grant execute on function public.jimport_delete_sale_restore_inventory(text) to authenticated;
notify pgrst, 'reload schema';
