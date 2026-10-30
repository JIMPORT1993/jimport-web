-- Ejecutar después de INVENTARIO_PRIVADO_SUPABASE.sql y de autorizar el usuario administrador.
create table if not exists public.private_product_costs (
 product_id uuid primary key references public.products(id) on delete cascade,
 unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
 updated_at timestamptz not null default now()
);
alter table public.private_product_costs enable row level security;
revoke all on public.private_product_costs from public, anon, authenticated;
grant select,insert,update on public.private_product_costs to authenticated;
drop policy if exists "JIMPORT admins read private costs" on public.private_product_costs;
create policy "JIMPORT admins read private costs" on public.private_product_costs for select to authenticated using (exists(select 1 from public.jimport_admins where user_id=(select auth.uid())));
drop policy if exists "JIMPORT admins insert private costs" on public.private_product_costs;
create policy "JIMPORT admins insert private costs" on public.private_product_costs for insert to authenticated with check (exists(select 1 from public.jimport_admins where user_id=(select auth.uid())));
drop policy if exists "JIMPORT admins update private costs" on public.private_product_costs;
create policy "JIMPORT admins update private costs" on public.private_product_costs for update to authenticated using (exists(select 1 from public.jimport_admins where user_id=(select auth.uid()))) with check (exists(select 1 from public.jimport_admins where user_id=(select auth.uid())));
