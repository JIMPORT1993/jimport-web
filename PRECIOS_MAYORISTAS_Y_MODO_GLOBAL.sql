-- PRECIOS MAYORISTAS Y SELECTOR GLOBAL DE PRECIO VISIBLE EN LA TIENDA
alter table public.products add column if not exists wholesale_price numeric(12,2) check (wholesale_price is null or wholesale_price >= 0);

create table if not exists public.jimport_store_settings (
  id text primary key default 'main' check (id = 'main'),
  display_price_mode text not null default 'retail' check (display_price_mode in ('retail','wholesale')),
  updated_at timestamptz not null default now()
);
insert into public.jimport_store_settings (id, display_price_mode) values ('main','retail') on conflict (id) do nothing;
alter table public.jimport_store_settings enable row level security;
drop policy if exists "Public can read store price mode" on public.jimport_store_settings;
create policy "Public can read store price mode" on public.jimport_store_settings for select to anon, authenticated using (true);
drop policy if exists "Admins can manage store price mode" on public.jimport_store_settings;
create policy "Admins can manage store price mode" on public.jimport_store_settings for all to authenticated using (public.jimport_is_admin()) with check (public.jimport_is_admin());
