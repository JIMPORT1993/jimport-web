-- Ejecutar en el proyecto Supabase usado en config.js. No elimina filas existentes.
-- PROMOCIONES EDITABLES: aparecen en la portada y rotan cada 3 segundos.
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  link_url text,
  button_text text not null default 'Ver oferta',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.promotions enable row level security;
drop policy if exists "Public can view active promotions" on public.promotions;
create policy "Public can view active promotions" on public.promotions for select using (active = true);
drop policy if exists "Admins can view all promotions" on public.promotions;
create policy "Admins can view all promotions" on public.promotions for select to authenticated using (true);
drop policy if exists "Admins can insert promotions" on public.promotions;
create policy "Admins can insert promotions" on public.promotions for insert to authenticated with check (true);
drop policy if exists "Admins can update promotions" on public.promotions;
create policy "Admins can update promotions" on public.promotions for update to authenticated using (true) with check (true);
drop policy if exists "Admins can delete promotions" on public.promotions;
create policy "Admins can delete promotions" on public.promotions for delete to authenticated using (true);


-- Opiniones de clientes (moderadas antes de publicarse). Ejecutar en Supabase SQL Editor.
create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(trim(name)) between 1 and 70),
 rating integer not null check (rating between 1 and 5),
 comment text not null check (char_length(trim(comment)) between 10 and 1000),
 approved boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
drop policy if exists "Public can read approved reviews" on public.reviews;
create policy "Public can read approved reviews" on public.reviews for select to anon, authenticated using (approved = true);
drop policy if exists "Visitors can submit reviews" on public.reviews;
create policy "Visitors can submit reviews" on public.reviews for insert to anon, authenticated with check (approved = false);
-- Moderación desde admin.html (solo usuarios autenticados administradores).
-- IMPORTANTE: Crea únicamente cuentas de administradores en Authentication > Users.
drop policy if exists "Admins can read all reviews" on public.reviews;
create policy "Admins can read all reviews" on public.reviews for select to authenticated using (true);
drop policy if exists "Admins can moderate reviews" on public.reviews;
create policy "Admins can moderate reviews" on public.reviews for update to authenticated using (true) with check (true);
drop policy if exists "Admins can delete reviews" on public.reviews;
create policy "Admins can delete reviews" on public.reviews for delete to authenticated using (true);

-- Compatibilidad con campos de precios promocionales
alter table public.promotions add column if not exists regular_price numeric(12,2);
alter table public.promotions add column if not exists sale_price numeric(12,2);
-- Asegurar exposición del esquema en la API y refrescar caché
grant usage on schema public to anon, authenticated;
grant select on public.promotions to anon;
grant select, insert, update, delete on public.promotions to authenticated;
grant select, insert on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
notify pgrst, 'reload schema';
