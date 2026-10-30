-- Ejecutar DESPUÉS de INVENTARIO_PRIVADO_SUPABASE.sql y autorizar el usuario administrador.
create table if not exists public.inventory_movements (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id) on delete set null,
 movement_type text not null check (movement_type in ('entrada','venta','devolucion','ajuste_positivo','ajuste_negativo')),
 quantity integer not null check (quantity>0),
 reference text, notes text,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
-- Permitir conservar el historial incluso si se elimina un producto.
alter table public.inventory_movements alter column product_id drop not null;
alter table public.inventory_movements enable row level security;
revoke all on public.inventory_movements from anon,authenticated;
grant select on public.inventory_movements to authenticated;
drop policy if exists "Admins read movement history" on public.inventory_movements;
create policy "Admins read movement history" on public.inventory_movements for select to authenticated using (exists(select 1 from public.jimport_admins where user_id=(select auth.uid())));
create or replace function public.record_inventory_movement(p_product_id uuid,p_movement_type text,p_quantity integer,p_reference text default null,p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare current_qty integer; delta integer;
begin
 if auth.uid() is null or not exists(select 1 from public.jimport_admins where user_id=auth.uid()) then raise exception 'Administrador no autorizado'; end if;
 if p_quantity is null or p_quantity<1 or p_movement_type not in ('entrada','venta','devolucion','ajuste_positivo','ajuste_negativo') then raise exception 'Movimiento inválido'; end if;
 if not exists(select 1 from public.products where id=p_product_id) then raise exception 'Producto inexistente'; end if;
 delta:=case when p_movement_type in ('entrada','devolucion','ajuste_positivo') then p_quantity else -p_quantity end;
 insert into public.private_inventory(product_id,quantity,min_quantity) values(p_product_id,0,2) on conflict(product_id) do nothing;
 select quantity into current_qty from public.private_inventory where product_id=p_product_id for update;
 if current_qty+delta<0 then raise exception 'Existencias insuficientes: disponibles %',current_qty; end if;
 update public.private_inventory set quantity=current_qty+delta,updated_at=now() where product_id=p_product_id;
 insert into public.inventory_movements(product_id,movement_type,quantity,reference,notes,created_by) values(p_product_id,p_movement_type,p_quantity,left(p_reference,120),left(p_notes,500),auth.uid());
end $$;
revoke all on function public.record_inventory_movement(uuid,text,integer,text,text) from public,anon;
grant execute on function public.record_inventory_movement(uuid,text,integer,text,text) to authenticated;
