-- EJECUTAR el CONTENIDO en Supabase SQL Editor del proyecto de JIMPORT.
-- No elimina productos, promociones ni opiniones existentes.
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.jimport_admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.jimport_admins enable row level security;
-- ANTES DE USAR: sustituye el UUID siguiente por el UID de tu usuario en Authentication > Users.
-- insert into public.jimport_admins(user_id) values ('TU-UUID-DE-ADMIN') on conflict do nothing;
create table if not exists public.verified_purchases (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id) on delete restrict,
 sale_reference text not null,
 customer_label text,
 code_hash text not null unique,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '90 days'),
 redeemed_at timestamptz
);
create unique index if not exists verified_purchase_reference_product_idx on public.verified_purchases (sale_reference,product_id);
alter table public.verified_purchases enable row level security;
alter table public.reviews add column if not exists verified_purchase boolean not null default false;
alter table public.reviews add column if not exists verified_purchase_id uuid unique references public.verified_purchases(id);
-- Impedir que los visitantes creen opiniones sin validar una compra.
drop policy if exists "Visitors can submit reviews" on public.reviews;
revoke insert on public.reviews from anon;
create or replace function public.create_verified_purchase(sold_product_id uuid,sale_reference text,customer_label text default '')
returns text language plpgsql security definer set search_path = '' as $$
declare code text;
begin
 if auth.uid() is null or not exists(select 1 from public.jimport_admins where user_id=auth.uid()) then raise exception 'Administrador no autorizado'; end if;
 if length(trim(sale_reference))<2 or length(sale_reference)>100 then raise exception 'Referencia de venta inválida'; end if;
 if not exists(select 1 from public.products where id=sold_product_id) then raise exception 'Producto inexistente'; end if;
 code:='JIMP-'||upper(encode(extensions.gen_random_bytes(12),'hex'));
 insert into public.verified_purchases(product_id,sale_reference,customer_label,code_hash)
 values(sold_product_id,trim(sale_reference),left(trim(customer_label),100),encode(extensions.digest(code,'sha256'),'hex'));
 return code;
end $$;
create or replace function public.submit_verified_review(purchase_code text,reviewer_name text,review_rating integer,review_comment text)
returns void language plpgsql security definer set search_path = '' as $$
declare purchase_id uuid;
begin
 if length(trim(reviewer_name)) not between 1 and 70 or length(trim(review_comment)) not between 10 and 1000 or review_rating not between 1 and 5 then raise exception 'Opinión inválida'; end if;
 select id into purchase_id from public.verified_purchases
 where code_hash=encode(extensions.digest(upper(trim(purchase_code)),'sha256'),'hex') and redeemed_at is null and expires_at>now() for update;
 if purchase_id is null then raise exception 'Código inválido, caducado o utilizado'; end if;
 insert into public.reviews(name,rating,comment,approved,verified_purchase,verified_purchase_id)
 values(trim(reviewer_name),review_rating,trim(review_comment),true,true,purchase_id);
 update public.verified_purchases set redeemed_at=now() where id=purchase_id;
end $$;
revoke all on function public.create_verified_purchase(uuid,text,text) from public,anon;
grant execute on function public.create_verified_purchase(uuid,text,text) to authenticated;
revoke all on function public.submit_verified_review(text,text,integer,text) from public;
grant execute on function public.submit_verified_review(text,text,integer,text) to anon,authenticated;
grant usage on schema public to anon,authenticated;
grant select on public.reviews to anon,authenticated;
notify pgrst, 'reload schema';
