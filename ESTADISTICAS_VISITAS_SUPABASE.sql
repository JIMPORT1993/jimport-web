-- Ejecutar UNA VEZ en Supabase > SQL Editor.
-- Las visitas son privadas y solo administradores autorizados pueden consultar estadísticas.
create table if not exists public.jimport_daily_visitors (
 visit_day date not null,
 visitor_hash text not null,
 first_seen timestamptz not null default now(),
 primary key(visit_day,visitor_hash)
);
alter table public.jimport_daily_visitors enable row level security;
revoke all on public.jimport_daily_visitors from anon, authenticated;
-- No se crean políticas de lectura pública.
create or replace function public.jimport_record_visit(p_visitor_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_day date;
begin
 if p_visitor_id is null or length(p_visitor_id)>100 or p_visitor_id !~ '^[a-zA-Z0-9-]{20,100}$' then return; end if;
 v_day := (now() at time zone 'America/Guayaquil')::date;
 insert into public.jimport_daily_visitors(visit_day,visitor_hash)
 values(v_day,encode(extensions.digest(p_visitor_id,'sha256'),'hex'))
 on conflict do nothing;
end; $$;
-- pgcrypto se instala normalmente en el esquema extensions de Supabase.
revoke all on function public.jimport_record_visit(text) from public;
grant execute on function public.jimport_record_visit(text) to anon,authenticated;
create or replace function public.jimport_admin_visit_stats()
returns table(day date, visitors bigint)
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.jimport_admins where user_id=auth.uid()) then
  raise exception 'Administrador no autorizado';
 end if;
 return query
 with dates as (select ((now() at time zone 'America/Guayaquil')::date - i)::date d from generate_series(0,29) i)
 select dates.d, count(v.visitor_hash)::bigint from dates left join public.jimport_daily_visitors v on v.visit_day=dates.d group by dates.d order by dates.d desc;
end; $$;
revoke all on function public.jimport_admin_visit_stats() from public;
grant execute on function public.jimport_admin_visit_stats() to authenticated;
