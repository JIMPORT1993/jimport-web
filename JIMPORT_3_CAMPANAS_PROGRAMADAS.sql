-- JIMPORT 3.0: programación de promociones y portadas.
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- No elimina ni modifica promociones o productos existentes.

alter table public.promotions
  add column if not exists campaign_name text,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists badge_text text;

create index if not exists promotions_active_schedule_idx
  on public.promotions (active, start_at, end_at);

notify pgrst, 'reload schema';
