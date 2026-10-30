-- JIMPORT: ejecutar en Supabase SQL Editor con el propietario del proyecto.
-- Conserva productos y datos existentes. No introducir claves privadas en config.js.
create table if not exists public.jimport_admins(user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.jimport_admins enable row level security;
revoke all on public.jimport_admins from anon,authenticated;
create or replace function public.jimport_is_admin() returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.jimport_admins where user_id=(select auth.uid())); $$;
revoke all on function public.jimport_is_admin() from public;
grant execute on function public.jimport_is_admin() to authenticated;
-- IMPORTANTE: sustituir UUID_DEL_ADMINISTRADOR por el UUID de Authentication > Users y ejecutar:
-- insert into public.jimport_admins(user_id) values ('UUID_DEL_ADMINISTRADOR') on conflict do nothing;
create table if not exists public.jimport_inventory_private(
 product_id uuid primary key references public.products(id) on delete cascade,
 quantity integer not null default 0 check(quantity>=0),
 min_quantity integer not null default 3 check(min_quantity>=0),
 landed_cost numeric(12,2) not null default 0 check(landed_cost>=0),
 updated_at timestamptz not null default now()
);
alter table public.jimport_inventory_private enable row level security;
revoke all on public.jimport_inventory_private from anon;
grant select,insert,update,delete on public.jimport_inventory_private to authenticated;
drop policy if exists "JIMPORT private inventory read" on public.jimport_inventory_private;
create policy "JIMPORT private inventory read" on public.jimport_inventory_private for select to authenticated using (public.jimport_is_admin());
drop policy if exists "JIMPORT private inventory insert" on public.jimport_inventory_private;
create policy "JIMPORT private inventory insert" on public.jimport_inventory_private for insert to authenticated with check (public.jimport_is_admin());
drop policy if exists "JIMPORT private inventory update" on public.jimport_inventory_private;
create policy "JIMPORT private inventory update" on public.jimport_inventory_private for update to authenticated using (public.jimport_is_admin()) with check (public.jimport_is_admin());
drop policy if exists "JIMPORT private inventory delete" on public.jimport_inventory_private;
create policy "JIMPORT private inventory delete" on public.jimport_inventory_private for delete to authenticated using (public.jimport_is_admin());
-- Endurecer productos: no basta con estar autenticado.
drop policy if exists "Admins can view all products" on public.products;
create policy "Admins can view all products" on public.products for select to authenticated using (public.jimport_is_admin());
drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products" on public.products for insert to authenticated with check (public.jimport_is_admin());
drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" on public.products for update to authenticated using (public.jimport_is_admin()) with check (public.jimport_is_admin());
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products for delete to authenticated using (public.jimport_is_admin());
-- Permitir el estado de llegada sin perder productos existentes.
alter table public.products drop constraint if exists products_stock_check;
alter table public.products add constraint products_stock_check check(stock in ('En stock','Bajo pedido','Agotado','Producto llegando'));
