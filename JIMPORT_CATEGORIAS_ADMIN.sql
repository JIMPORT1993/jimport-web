-- Ejecutar en Supabase SQL Editor antes de crear categorías desde el panel.
create table if not exists public.jimport_categories (
 id bigint generated always as identity primary key,
 name text not null unique,
 created_at timestamptz not null default now()
);
alter table public.jimport_categories enable row level security;
grant select on public.jimport_categories to anon, authenticated;
grant insert on public.jimport_categories to authenticated;
grant usage, select on sequence public.jimport_categories_id_seq to authenticated;
drop policy if exists "Public can read categories" on public.jimport_categories;
create policy "Public can read categories" on public.jimport_categories for select using (true);
drop policy if exists "Only admins create categories" on public.jimport_categories;
create policy "Only admins create categories" on public.jimport_categories
 for insert to authenticated with check (public.jimport_is_admin());
