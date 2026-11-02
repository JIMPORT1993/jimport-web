-- Ejecutar una sola vez en Supabase SQL Editor.
-- No modifica productos ni inventario existentes.
create table if not exists public.jimport_super_combos (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 2 and 120),
 description text not null default '',
 items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) >= 2),
 combo_price numeric(12,2) not null check (combo_price > 0),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.jimport_super_combos enable row level security;
revoke all on public.jimport_super_combos from anon, authenticated;
grant select on public.jimport_super_combos to anon, authenticated;
grant insert, update, delete on public.jimport_super_combos to authenticated;
drop policy if exists "Public can see active combos" on public.jimport_super_combos;
create policy "Public can see active combos" on public.jimport_super_combos for select to anon using (active = true);
drop policy if exists "Admins can see combos" on public.jimport_super_combos;
create policy "Admins can see combos" on public.jimport_super_combos for select to authenticated using (public.jimport_is_admin());
drop policy if exists "Admins can create combos" on public.jimport_super_combos;
create policy "Admins can create combos" on public.jimport_super_combos for insert to authenticated with check (public.jimport_is_admin());
drop policy if exists "Admins can edit combos" on public.jimport_super_combos;
create policy "Admins can edit combos" on public.jimport_super_combos for update to authenticated using (public.jimport_is_admin()) with check (public.jimport_is_admin());
drop policy if exists "Admins can delete combos" on public.jimport_super_combos;
create policy "Admins can delete combos" on public.jimport_super_combos for delete to authenticated using (public.jimport_is_admin());
-- No se publica el costo privado de llegada ni se alteran precios individuales.
