-- Ejecutar en Supabase SQL Editor después de los scripts de ventas.
-- Solo lectura: no modifica inventario ni ventas.
create or replace function public.jimport_daily_sales_report(p_start date, p_end date)
returns table (sale_day date, sale_reference text, product_name text, brand text,
 quantity integer, unit_price numeric, unit_cost numeric, revenue numeric, cost_total numeric, profit numeric,
 sale_time timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
 if not public.jimport_is_admin() then raise exception 'Administrador no autorizado'; end if;
 if p_start is null or p_end is null or p_end < p_start or p_end - p_start > 366 then
  raise exception 'Selecciona un rango válido de hasta 366 días';
 end if;
 return query
 select (s.created_at at time zone 'America/Guayaquil')::date,
 s.sale_reference::text, coalesce(p.name,'Producto eliminado')::text,
 coalesce(p.brand,'')::text, s.quantity, s.unit_price, s.unit_cost,
 (s.quantity*s.unit_price)::numeric, (s.quantity*s.unit_cost)::numeric,
 (s.quantity*(s.unit_price-s.unit_cost))::numeric, s.created_at
 from public.jimport_sales s join public.products p on p.id=s.product_id
 where (s.created_at at time zone 'America/Guayaquil')::date between p_start and p_end
 order by s.created_at desc, p.name;
end $$;
revoke all on function public.jimport_daily_sales_report(date,date) from public,anon;
grant execute on function public.jimport_daily_sales_report(date,date) to authenticated;
notify pgrst, 'reload schema';
