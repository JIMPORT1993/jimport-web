-- JIMPORT: estados de disponibilidad e inventario.
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- Permite "Producto llegando" aunque el inventario físico esté en cero.
do $$
declare c record;
begin
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.products'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%stock%'
  loop
    execute format('alter table public.products drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.products
  add constraint products_stock_status_check
  check (stock in ('En stock','Bajo pedido','Agotado','Producto llegando'));

-- Al insertar o cambiar la cantidad:
-- 0 unidades => Agotado; más de 0 => En stock.
-- Si el administrador cambia manualmente el estado después (por ejemplo,
-- a Producto llegando), los guardados de la misma cantidad no lo reemplazan.
create or replace function public.jimport_sync_stock_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or old.quantity is distinct from new.quantity then
    update public.products
       set stock = case when new.quantity <= 0 then 'Agotado' else 'En stock' end
     where id = new.product_id;
  end if;
  return new;
end $$;

drop trigger if exists jimport_inventory_stock_status on public.jimport_inventory_private;
create trigger jimport_inventory_stock_status
after insert or update of quantity
on public.jimport_inventory_private
for each row execute function public.jimport_sync_stock_status();

notify pgrst, 'reload schema';
