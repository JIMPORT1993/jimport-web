-- Ejecutar UNA VEZ en Supabase > SQL Editor (JIMPORT).
-- El administrador existente se comprueba mediante public.jimport_is_admin().
create table if not exists public.jimport_brand_media (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('UGREEN','ANKER','JIMPORT')),
  title text not null check (length(title) between 1 and 120),
  media_type text not null check (media_type in ('image','video','youtube')),
  media_url text not null check (media_url ~ '^https://'),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.jimport_brand_media enable row level security;
drop policy if exists "Public can see active brand media" on public.jimport_brand_media;
create policy "Public can see active brand media" on public.jimport_brand_media for select to anon,authenticated using (active or public.jimport_is_admin());
drop policy if exists "Admins can insert brand media" on public.jimport_brand_media;
create policy "Admins can insert brand media" on public.jimport_brand_media for insert to authenticated with check (public.jimport_is_admin());
drop policy if exists "Admins can update brand media" on public.jimport_brand_media;
create policy "Admins can update brand media" on public.jimport_brand_media for update to authenticated using (public.jimport_is_admin()) with check (public.jimport_is_admin());
drop policy if exists "Admins can delete brand media" on public.jimport_brand_media;
create policy "Admins can delete brand media" on public.jimport_brand_media for delete to authenticated using (public.jimport_is_admin());
grant select on public.jimport_brand_media to anon,authenticated;
grant insert,update,delete on public.jimport_brand_media to authenticated;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('jimport-brand-media','jimport-brand-media',true,41943040,array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Admins upload brand media" on storage.objects;
create policy "Admins upload brand media" on storage.objects for insert to authenticated with check (bucket_id='jimport-brand-media' and public.jimport_is_admin());
-- Las imágenes y videos del bucket público pueden consultarse sin autenticación.
