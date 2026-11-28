-- Ejecutar una vez desde SQL Editor. Requiere la función jimport_is_admin existente.
create table if not exists public.jimport_marketing_posts (
 job uuid not null, platform text not null check(platform in ('Facebook','Instagram','Telegram')),
 status text not null check(status in ('pending','published','uncertain')), caption text not null,
 external_id text, created_at timestamptz not null default now(), primary key(job,platform)
);
alter table public.jimport_marketing_posts enable row level security;
grant select,insert,update on public.jimport_marketing_posts to authenticated;
drop policy if exists marketing_admin on public.jimport_marketing_posts;
create policy marketing_admin on public.jimport_marketing_posts for all to authenticated using(public.jimport_is_admin()) with check(public.jimport_is_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('jimport-marketing','jimport-marketing',true,3000000,array['image/jpeg']) on conflict(id) do nothing;
drop policy if exists marketing_admin_upload on storage.objects;
create policy marketing_admin_upload on storage.objects for insert to authenticated with check(bucket_id='jimport-marketing' and public.jimport_is_admin());
