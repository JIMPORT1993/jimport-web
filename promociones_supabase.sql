-- Ejecutar en Supabase > SQL Editor > New query > Run.
-- No borra ni modifica los productos registrados ni las promociones existentes.
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
create policy "Public can view active promotions" on public.promotions for select to anon using (active = true);
drop policy if exists "Admins can view all promotions" on public.promotions;
create policy "Admins can view all promotions" on public.promotions for select to authenticated using (true);
drop policy if exists "Admins can insert promotions" on public.promotions;
create policy "Admins can insert promotions" on public.promotions for insert to authenticated with check (true);
drop policy if exists "Admins can update promotions" on public.promotions;
create policy "Admins can update promotions" on public.promotions for update to authenticated using (true) with check (true);
drop policy if exists "Admins can delete promotions" on public.promotions;
create policy "Admins can delete promotions" on public.promotions for delete to authenticated using (true);
