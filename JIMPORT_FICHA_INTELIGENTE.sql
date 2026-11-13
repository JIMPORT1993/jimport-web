-- Ejecutar UNA SOLA VEZ en Supabase > SQL Editor.
-- Añade un campo opcional para registrar hasta 12 URLs de fotografías adicionales por producto.
alter table public.products add column if not exists gallery_images jsonb not null default '[]'::jsonb;

comment on column public.products.gallery_images is 'URLs HTTPS de fotografías adicionales del producto para la ficha inteligente JIMPORT';
