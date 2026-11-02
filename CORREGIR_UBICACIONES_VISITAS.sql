-- Ejecutar en Supabase > SQL Editor como administrador del proyecto.
-- Requiere public.jimport_daily_visitors, public.jimport_is_admin() y columna visitor_hash.
alter table public.jimport_daily_visitors add column if not exists country text;
alter table public.jimport_daily_visitors add column if not exists city text;
create or replace function public.jimport_admin_visit_locations()
returns table(country text, city text, visitors bigint)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.jimport_is_admin() then
    raise exception 'Administrador no autorizado';
  end if;
  return query
    select coalesce(v.country,'Desconocido')::text,
           coalesce(v.city,'Desconocida')::text,
           count(distinct v.visitor_hash)::bigint
    from public.jimport_daily_visitors v
    where v.visit_day >= ((now() at time zone 'America/Guayaquil')::date - 29)
    group by 1,2 order by 3 desc;
end;
$$;
revoke all on function public.jimport_admin_visit_locations() from public;
grant execute on function public.jimport_admin_visit_locations() to authenticated;
notify pgrst, 'reload schema';
