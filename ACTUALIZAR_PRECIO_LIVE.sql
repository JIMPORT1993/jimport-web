-- JIMPORT: modo Precio LIVE independiente
-- Ejecutar una sola vez en Supabase SQL Editor. No modifica precios de productos.
ALTER TABLE public.jimport_store_settings
  ADD COLUMN IF NOT EXISTS live_show_discount boolean NOT NULL DEFAULT true;

-- El modo se guarda en display_price_mode: retail | wholesale | live.
-- No se cambia la configuración actual automáticamente.
UPDATE public.jimport_store_settings
SET live_show_discount = COALESCE(live_show_discount, true)
WHERE id = 'main';
