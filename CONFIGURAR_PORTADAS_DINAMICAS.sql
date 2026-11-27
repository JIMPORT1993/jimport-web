-- JIMPORT: portadas dinámicas administrables
-- Ejecutar una sola vez en Supabase > SQL Editor.
create table if not exists public.jimport_home_banners (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default 'JIMPORT · TECNOLOGÍA',
  title text not null,
  subtitle text,
  description text,
  button_text text not null default 'Explorar catálogo',
  button_url text not null default '#productos',
  image_url text not null,
  sort_order integer not null default 0,
  duration_seconds integer not null default 7 check (duration_seconds between 4 and 60),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.jimport_home_banners enable row level security;
grant select on public.jimport_home_banners to anon, authenticated;
grant insert, update, delete on public.jimport_home_banners to authenticated;
drop policy if exists "Public can view active JIMPORT home banners" on public.jimport_home_banners;
create policy "Public can view active JIMPORT home banners"
on public.jimport_home_banners for select to anon, authenticated
using (active = true or public.jimport_is_admin());
drop policy if exists "JIMPORT admins manage home banners" on public.jimport_home_banners;
create policy "JIMPORT admins manage home banners"
on public.jimport_home_banners for all to authenticated
using (public.jimport_is_admin()) with check (public.jimport_is_admin());

-- Bucket público para las imágenes de portada. Solo administradores pueden subir, cambiar o borrar.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jimport-home-banners', 'jimport-home-banners', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];
drop policy if exists "Public read JIMPORT home banner images" on storage.objects;
create policy "Public read JIMPORT home banner images"
on storage.objects for select to public
using (bucket_id = 'jimport-home-banners');
drop policy if exists "Admins upload JIMPORT home banner images" on storage.objects;
create policy "Admins upload JIMPORT home banner images"
on storage.objects for insert to authenticated
with check (bucket_id = 'jimport-home-banners' and public.jimport_is_admin());
drop policy if exists "Admins update JIMPORT home banner images" on storage.objects;
create policy "Admins update JIMPORT home banner images"
on storage.objects for update to authenticated
using (bucket_id = 'jimport-home-banners' and public.jimport_is_admin())
with check (bucket_id = 'jimport-home-banners' and public.jimport_is_admin());
drop policy if exists "Admins delete JIMPORT home banner images" on storage.objects;
create policy "Admins delete JIMPORT home banner images"
on storage.objects for delete to authenticated
using (bucket_id = 'jimport-home-banners' and public.jimport_is_admin());

-- Tres portadas iniciales creadas para JIMPORT. Se insertan solo si aún no existen.
insert into public.jimport_home_banners
(eyebrow,title,subtitle,description,button_text,button_url,image_url,sort_order,duration_seconds,active)
select v.eyebrow,v.title,v.subtitle,v.description,v.button_text,v.button_url,v.image_url,v.sort_order,7,true
from (values
 ('JIMPORT · ENERGÍA','Carga más rápido.','Conecta sin límites.','Cargadores, cables y power banks para mantener tus dispositivos siempre listos.','Ver cargadores','#productos','https://jimport-web.vercel.app/assets/portada-carga.webp',1),
 ('JIMPORT · CONECTIVIDAD','Todo conectado.','Más posibilidades.','Hubs, adaptadores y soluciones prácticas para ampliar tu espacio de trabajo.','Explorar accesorios','#productos','https://jimport-web.vercel.app/assets/portada-conectividad.webp',2),
 ('JIMPORT · AUDIO Y CREACIÓN','Tu mundo suena mejor.','Crea a tu manera.','Audio, micrófonos y accesorios para disfrutar, comunicar y crear contenido.','Descubrir productos','#productos','https://jimport-web.vercel.app/assets/portada-audio.webp',3)
) as v(eyebrow,title,subtitle,description,button_text,button_url,image_url,sort_order)
where not exists (select 1 from public.jimport_home_banners b where b.title=v.title);
