-- EJECUTAR en Supabase SQL Editor después de crear tu usuario en Authentication.
-- Sustituye el correo indicado por el correo REAL del administrador antes de ejecutar.
create table if not exists public.jimport_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.jimport_admins enable row level security;
revoke all on public.jimport_admins from anon, authenticated;
-- Solo SQL Editor (rol postgres/service_role) puede gestionar administradores.
-- CAMBIA el correo y quita los comentarios de las siguientes líneas:
-- insert into public.jimport_admins(user_id)
-- select id from auth.users where email = 'TU_CORREO_ADMIN@EJEMPLO.COM'
-- on conflict (user_id) do nothing;
create table if not exists public.private_inventory (
 product_id uuid primary key references public.products(id) on delete cascade,
 quantity integer not null default 0 check (quantity>=0),
 min_quantity integer not null default 2 check (min_quantity>=0),
 updated_at timestamptz not null default now()
);
alter table public.private_inventory enable row level security;
revoke all on public.private_inventory from anon;
grant select,insert,update,delete on public.private_inventory to authenticated;
drop policy if exists "Only JIMPORT admins can read inventory" on public.private_inventory;
create policy "Only JIMPORT admins can read inventory" on public.private_inventory for select to authenticated using (exists (select 1 from public.jimport_admins a where a.user_id=(select auth.uid())));
drop policy if exists "Only JIMPORT admins can add inventory" on public.private_inventory;
create policy "Only JIMPORT admins can add inventory" on public.private_inventory for insert to authenticated with check (exists (select 1 from public.jimport_admins a where a.user_id=(select auth.uid())));
drop policy if exists "Only JIMPORT admins can update inventory" on public.private_inventory;
create policy "Only JIMPORT admins can update inventory" on public.private_inventory for update to authenticated using (exists (select 1 from public.jimport_admins a where a.user_id=(select auth.uid()))) with check (exists (select 1 from public.jimport_admins a where a.user_id=(select auth.uid())));
-- La disponibilidad pública (products.stock) se edita por separado en el formulario de producto.
-- IMPORTANTE: restringe también las políticas antiguas de products si existen otros usuarios autenticados.
