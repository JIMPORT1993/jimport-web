-- Ejecutar en Supabase SQL Editor (una vez). Requiere public.jimport_is_admin().
create table if not exists public.jimport_brands (id bigint generated always as identity primary key, name text not null unique, created_at timestamptz default now());
create table if not exists public.jimport_categories (id bigint generated always as identity primary key, name text not null unique, created_at timestamptz default now());
alter table public.jimport_brands enable row level security;
alter table public.jimport_categories enable row level security;
drop policy if exists "Public read brands" on public.jimport_brands;
create policy "Public read brands" on public.jimport_brands for select using (true);
drop policy if exists "Public read categories" on public.jimport_categories;
create policy "Public read categories" on public.jimport_categories for select using (true);
drop policy if exists "Admins insert brands" on public.jimport_brands;
create policy "Admins insert brands" on public.jimport_brands for insert to authenticated with check (public.jimport_is_admin());
drop policy if exists "Admins delete brands" on public.jimport_brands;
create policy "Admins delete brands" on public.jimport_brands for delete to authenticated using (public.jimport_is_admin());
drop policy if exists "Admins insert categories" on public.jimport_categories;
create policy "Admins insert categories" on public.jimport_categories for insert to authenticated with check (public.jimport_is_admin());
drop policy if exists "Admins delete categories" on public.jimport_categories;
create policy "Admins delete categories" on public.jimport_categories for delete to authenticated using (public.jimport_is_admin());
notify pgrst, 'reload schema';
