-- Vincula cada promoción con el producto del catálogo.
-- Ejecutar una sola vez en Supabase > SQL Editor.
alter table public.promotions
  add column if not exists product_id text;

create index if not exists promotions_product_id_active_idx
  on public.promotions (product_id)
  where active = true;

comment on column public.promotions.product_id is
  'ID del producto del catálogo que queda temporalmente fuera del catálogo normal mientras esta promoción esté activa.';
