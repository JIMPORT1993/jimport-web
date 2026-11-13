-- JIMPORT: habilitar el modo Precio LIVE en la configuración global.
-- Ejecutar en Supabase > SQL Editor.
-- No modifica precios, inventario ni ventas.

ALTER TABLE public.jimport_store_settings
  DROP CONSTRAINT IF EXISTS jimport_store_settings_display_price_mode_check;

ALTER TABLE public.jimport_store_settings
  ADD CONSTRAINT jimport_store_settings_display_price_mode_check
  CHECK (display_price_mode IN ('retail', 'wholesale', 'live'));

ALTER TABLE public.jimport_store_settings
  ADD COLUMN IF NOT EXISTS live_show_discount boolean NOT NULL DEFAULT true;

-- Asegura que la opción de mostrar el ahorro tenga un valor definido.
UPDATE public.jimport_store_settings
SET live_show_discount = COALESCE(live_show_discount, true)
WHERE id = 'main';

-- Verificación: debe mostrar retail, wholesale o live como modos permitidos.
SELECT id, display_price_mode, live_show_discount
FROM public.jimport_store_settings
WHERE id = 'main';
