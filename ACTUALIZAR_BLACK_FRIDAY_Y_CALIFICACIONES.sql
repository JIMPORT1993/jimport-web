-- Ejecutar una sola vez en Supabase SQL Editor del proyecto JIMPORT.
-- Añade el interruptor para activar/desactivar Black Friday desde el administrador.
ALTER TABLE public.jimport_store_settings
  ADD COLUMN IF NOT EXISTS black_friday_enabled boolean NOT NULL DEFAULT false;

INSERT INTO public.jimport_store_settings (id, display_price_mode, black_friday_enabled)
VALUES ('main', 'retail', false)
ON CONFLICT (id) DO NOTHING;

-- La tabla de opiniones y la función submit_verified_review no se modifican.
-- Las opiniones dejan de mostrarse en la portada, pero se siguen recibiendo
-- desde calificar.html usando el código de compra verificada.
