-- Ejecutar en proyecto existente. No sustituye migraciones anteriores.
begin;
create table if not exists public.jx_business (id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('pedido','cliente','proveedor','gasto','garantia')), title text not null check(length(title) between 1 and 200), detail text not null default '', amount numeric(12,2) not null default 0 check(amount>=0), state text not null default 'Pendiente', guide text not null default '', created_at timestamptz not null default now());
create table if not exists public.jx_events (id bigint generated always as identity primary key, kind text not null check(kind in ('busqueda','sin_resultados','producto','whatsapp','carrito','disponibilidad')), label text not null check(length(label) between 1 and 150), created_at timestamptz not null default now());
alter table public.jx_business enable row level security;
alter table public.jx_events enable row level security;
revoke all on public.jx_business,public.jx_events from anon,authenticated;
grant select,insert,update,delete on public.jx_business to authenticated;
grant select on public.jx_events to authenticated;
grant insert on public.jx_events to anon,authenticated;
grant usage on sequence public.jx_events_id_seq to anon,authenticated;
drop policy if exists jx_admin on public.jx_business;
create policy jx_admin on public.jx_business for all to authenticated using(public.jimport_is_admin()) with check(public.jimport_is_admin());
drop policy if exists jx_read on public.jx_events;
create policy jx_read on public.jx_events for select to authenticated using(public.jimport_is_admin());
drop policy if exists jx_submit on public.jx_events;
create policy jx_submit on public.jx_events for insert to anon,authenticated with check(created_at between now()-interval '1 minute' and now()+interval '1 minute');
create index if not exists jx_events_date_idx on public.jx_events(created_at);
create or replace function public.jx_track(p_code uuid) returns table(state text,guide text,created_at timestamptz) language sql stable security definer set search_path='' as $$ select b.state,b.guide,b.created_at from public.jx_business b where b.id=p_code and b.kind='pedido' $$;
revoke all on function public.jx_track(uuid) from public;
grant execute on function public.jx_track(uuid) to anon,authenticated;
-- Restringe exclusivamente las políticas administrativas conocidas del esquema original.
do $$ declare t text; p record; begin foreach t in array array['products','promotions','reviews'] loop for p in select policyname,cmd from pg_policies where schemaname='public' and tablename=t and policyname like 'Admins can %' loop execute format('drop policy %I on public.%I',p.policyname,t); if p.cmd='INSERT' then execute format('create policy %I on public.%I for insert to authenticated with check (public.jimport_is_admin())',p.policyname,t); elsif p.cmd='UPDATE' then execute format('create policy %I on public.%I for update to authenticated using (public.jimport_is_admin()) with check (public.jimport_is_admin())',p.policyname,t); elsif p.cmd in ('SELECT','DELETE') then execute format('create policy %I on public.%I for %s to authenticated using (public.jimport_is_admin())',p.policyname,t,p.cmd); end if; end loop; end loop; end $$;
commit;
