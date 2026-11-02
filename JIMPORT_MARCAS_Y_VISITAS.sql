-- Ejecutar en Supabase SQL Editor, una vez. Requiere jimport_admins y tabla jimport_daily_visitors existente.
create table if not exists public.jimport_brands(id bigint generated always as identity primary key,name text not null unique,created_at timestamptz default now());
alter table public.jimport_brands enable row level security;
drop policy if exists "Marcas visibles" on public.jimport_brands;
create policy "Marcas visibles" on public.jimport_brands for select using(true);
drop policy if exists "Administradores crean marcas" on public.jimport_brands;
create policy "Administradores crean marcas" on public.jimport_brands for insert to authenticated with check(public.jimport_is_admin());
alter table public.jimport_daily_visitors add column if not exists country text;
alter table public.jimport_daily_visitors add column if not exists city text;
create or replace function public.jimport_admin_visit_locations()
returns table(country text,city text,visitors bigint)
language plpgsql security definer set search_path = '' as $$
begin
 if not public.jimport_is_admin() then raise exception 'Administrador no autorizado'; end if;
 return query select coalesce(v.country,'Desconocido'),coalesce(v.city,'Desconocida'),count(distinct v.visitor_hash)::bigint
 from public.jimport_daily_visitors v where v.visit_day >= ((now() at time zone 'America/Guayaquil')::date - 29)
 group by 1,2 order by 3 desc;
end;$$;
revoke all on function public.jimport_admin_visit_locations() from public;
grant execute on function public.jimport_admin_visit_locations() to authenticated;
