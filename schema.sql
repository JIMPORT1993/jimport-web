-- Ejecuta todo este archivo en Supabase > SQL Editor > New query > Run.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  model text,
  price numeric(12,2) not null default 0 check (price >= 0),
  old_price numeric(12,2) check (old_price is null or old_price >= 0),
  stock text not null default 'En stock' check (stock in ('En stock','Bajo pedido','Agotado')),
  quantity integer check (quantity is null or quantity >= 0),
  low_stock_threshold integer not null default 3 check (low_stock_threshold >= 0),
  image_url text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products" on public.products for select using (active = true);
drop policy if exists "Admins can view all products" on public.products;
create policy "Admins can view all products" on public.products for select to authenticated using (true);
drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products" on public.products for insert to authenticated with check (true);
drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" on public.products for update to authenticated using (true) with check (true);
drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products for delete to authenticated using (true);

-- NOTA DE SEGURIDAD:
-- Para un sitio de producción con más de un usuario, limita las políticas de escritura
-- a una tabla de administradores o a roles específicos. No compartas la clave service_role.
-- Crea solo una cuenta administradora en Authentication > Users.


-- Migración segura para proyectos JIMPORT creados con una versión anterior:
alter table public.products add column if not exists quantity integer;
alter table public.products add column if not exists low_stock_threshold integer not null default 3;

-- Configuración editable de la portada (incluye banner promocional gigante).
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "Public can view homepage promo" on public.site_settings;
create policy "Public can view homepage promo" on public.site_settings for select using (key = 'homepage_promo');
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings for all to authenticated using (true) with check (true);
