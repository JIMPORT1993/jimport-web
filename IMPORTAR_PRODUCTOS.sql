-- IMPORTACIÓN DE PRODUCTOS JIMPORT desde PRECIOS PARA NOSOTROS Y LIVE.xlsx
-- El precio utilizado es exclusivamente la columna I (PRECIO NORMAL). old_price queda NULL.
-- Antes de ejecutar: sube la carpeta assets/products junto al sitio web y ejecuta schema.sql si aún no lo hiciste.
-- Ejecutar este archivo en Supabase > SQL Editor.

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Micrófono gaming USB', 'UGREEN', 'CM769', 63.00, NULL, 'En stock', 'assets/products/product-3-CM769.jpeg', 'Micrófono gaming USB • Iluminación RGB • Reducción de ruido ENC • Procesador DSP • Botón táctil de silencio', true, 'Micrófonos'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Micrófono gaming USB' AND p.model = 'CM769' AND p.description IS NOT DISTINCT FROM 'Micrófono gaming USB • Iluminación RGB • Reducción de ruido ENC • Procesador DSP • Botón táctil de silencio');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Adaptador Bluetooth 5.3 USB-A', 'UGREEN', 'CM591', 9.00, NULL, 'En stock', 'assets/products/product-4-CM591.png', 'Adaptador Bluetooth 5.3 USB-A • Conexión inalámbrica estable para computadoras compatibles', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Adaptador Bluetooth 5.3 USB-A' AND p.model = 'CM591' AND p.description IS NOT DISTINCT FROM 'Adaptador Bluetooth 5.3 USB-A • Conexión inalámbrica estable para computadoras compatibles');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Lector de tarjetas 2 en 1', 'UGREEN', 'CM304', 15.00, NULL, 'En stock', 'assets/products/product-5-CM304.jpeg', 'Lector de tarjetas 2 en 1 • Conectores USB-A 3.0 y USB-C • Ranuras para tarjetas SD y microSD/TF • Compatible con SDHC, SDXC, microSDHC y
microSDXC • Función OTG', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Lector de tarjetas 2 en 1' AND p.model = 'CM304' AND p.description IS NOT DISTINCT FROM 'Lector de tarjetas 2 en 1 • Conectores USB-A 3.0 y USB-C • Ranuras para tarjetas SD y microSD/TF • Compatible con SDHC, SDXC, microSDHC y
microSDXC • Función OTG');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Audífonos UGREEN Dots TWS', 'UGREEN', 'WS220', 35.00, NULL, 'En stock', 'assets/products/product-6-WS220.jpeg', 'Audífonos UGREEN Dots TWS • Bluetooth 6.0 • Resistencia IPX5 al agua y sudor • Baja latencia de 0,08 s • Color negro', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Audífonos UGREEN Dots TWS' AND p.model = 'WS220' AND p.description IS NOT DISTINCT FROM 'Audífonos UGREEN Dots TWS • Bluetooth 6.0 • Resistencia IPX5 al agua y sudor • Baja latencia de 0,08 s • Color negro');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Audífonos HiTune S3', 'UGREEN', 'WS209', 39.00, NULL, 'En stock', 'assets/products/product-7-WS209.jpeg', 'Audífonos HiTune S3 • Open-ear tipo clip • Bluetooth 5.4 • Drivers 12 mm • IA para llamadas • Hasta 30 h • IPX5 • Negro y purpura', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Audífonos HiTune S3' AND p.model = 'WS209' AND p.description IS NOT DISTINCT FROM 'Audífonos HiTune S3 • Open-ear tipo clip • Bluetooth 5.4 • Drivers 12 mm • IA para llamadas • Hasta 30 h • IPX5 • Negro y purpura');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Audífonos FitBuds open-ear', 'UGREEN', 'WS213', 61.00, NULL, 'En stock', 'assets/products/product-8-WS213.jpeg', 'Audífonos FitBuds open-ear • Bluetooth 6.0 • Audio espacial • Resistencia IPX5 al agua y sudor', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Audífonos FitBuds open-ear' AND p.model = 'WS213' AND p.description IS NOT DISTINCT FROM 'Audífonos FitBuds open-ear • Bluetooth 6.0 • Audio espacial • Resistencia IPX5 al agua y sudor');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable USB-A macho a USB-B macho', 'UGREEN', 'US135', 6.00, NULL, 'En stock', 'assets/products/product-9-US135.jpeg', 'Cable USB-A macho a USB-B macho • USB 2.0 • Longitud de 2 m • Compatible con impresoras, escáneres y otros equipos con puerto USB-B • Blindaje contra interferencias', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable USB-A macho a USB-B macho' AND p.model = 'US135' AND p.description IS NOT DISTINCT FROM 'Cable USB-A macho a USB-B macho • USB 2.0 • Longitud de 2 m • Compatible con impresoras, escáneres y otros equipos con puerto USB-B • Blindaje contra interferencias');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable  USB-A a USB-C', 'UGREEN', 'US287', 6.50, NULL, 'En stock', 'assets/products/product-10-US287.jpeg', 'Cable  USB-A a USB-C • Longitud de 2 m • Corriente de carga de hasta 3A • USB 2.0 • Transferencia de datos de hasta 480 Mbps • Conectores niquelados • Color blanco', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable  USB-A a USB-C' AND p.model = 'US287' AND p.description IS NOT DISTINCT FROM 'Cable  USB-A a USB-C • Longitud de 2 m • Corriente de carga de hasta 3A • USB 2.0 • Transferencia de datos de hasta 480 Mbps • Conectores niquelados • Color blanco');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable USB-C a USB-C', 'UGREEN', 'US316', 12.00, NULL, 'En stock', 'assets/products/product-17-US316.jpeg', 'Cable USB-C a USB-C • Carga rápida PD de hasta 100W • Corriente máxima de 5A • Chip E-Marker • Transferencia de datos de hasta 480 Mbps • Longitud de 2 metros • Nylon trenzado', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable USB-C a USB-C' AND p.model = 'US316' AND p.description IS NOT DISTINCT FROM 'Cable USB-C a USB-C • Carga rápida PD de hasta 100W • Corriente máxima de 5A • Chip E-Marker • Transferencia de datos de hasta 480 Mbps • Longitud de 2 metros • Nylon trenzado');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable USB-C a USB-C', 'UGREEN', 'US286', 8.00, NULL, 'En stock', 'assets/products/product-18-US286.jpeg', 'Cable USB-C a USB-C • Carga rápida PD de hasta 60W • Corriente máxima de 3A • Datos USB 2.0 hasta 480 Mbps • Longitud de 2 metros  • Recubrimiento de PVC', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable USB-C a USB-C' AND p.model = 'US286' AND p.description IS NOT DISTINCT FROM 'Cable USB-C a USB-C • Carga rápida PD de hasta 60W • Corriente máxima de 3A • Datos USB 2.0 hasta 480 Mbps • Longitud de 2 metros  • Recubrimiento de PVC');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable USB-A a USB-C', 'UGREEN', 'US287', 6.50, NULL, 'En stock', 'assets/products/product-19-US287.png', 'Cable USB-A a USB-C • Carga rápida de hasta 3A • Compatible con Ǫuick Charge 3.0/2.0 • Transferencia de datos de hasta 480 Mbps • Longitud de 2 metros • Color negro', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable USB-A a USB-C' AND p.model = 'US287' AND p.description IS NOT DISTINCT FROM 'Cable USB-A a USB-C • Carga rápida de hasta 3A • Compatible con Ǫuick Charge 3.0/2.0 • Transferencia de datos de hasta 480 Mbps • Longitud de 2 metros • Color negro');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable USB-C a USB-C', 'UGREEN', 'L530', 23.00, NULL, 'En stock', 'assets/products/product-20-L530.png', 'Cable USB-C a USB-C • Carga rápida PD 3.1 de hasta 240W • Corriente máxima de 5A • Transferencia de datos de hasta 480 Mbps • Longitud de 2 metros • Diseño trenzado', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable USB-C a USB-C' AND p.model = 'L530' AND p.description IS NOT DISTINCT FROM 'Cable USB-C a USB-C • Carga rápida PD 3.1 de hasta 240W • Corriente máxima de 5A • Transferencia de datos de hasta 480 Mbps • Longitud de 2 metros • Diseño trenzado');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable Uno USB-C a USB-C', 'UGREEN', 'L509', 15.00, NULL, 'En stock', 'assets/products/product-23-L509.png', 'Cable Uno USB-C a USB-C • Carga rápida PD • Corriente máxima de 5A • Chip E-Marker • Transmisión de datos • Longitud de 1 m • Color negro', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable Uno USB-C a USB-C' AND p.model = 'L509' AND p.description IS NOT DISTINCT FROM 'Cable Uno USB-C a USB-C • Carga rápida PD • Corriente máxima de 5A • Chip E-Marker • Transmisión de datos • Longitud de 1 m • Color negro');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable Uno USB-C a USB-C', 'UGREEN', 'L509', 20.00, NULL, 'En stock', 'assets/products/product-24-L509.png', 'Cable Uno USB-C a USB-C • Carga rápida PD • Corriente máxima de 5A • Chip E-Marker • Transmisión de datos • Longitud de 2 m • Color negro', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable Uno USB-C a USB-C' AND p.model = 'L509' AND p.description IS NOT DISTINCT FROM 'Cable Uno USB-C a USB-C • Carga rápida PD • Corriente máxima de 5A • Chip E-Marker • Transmisión de datos • Longitud de 2 m • Color negro');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable Uno USB-C a USB-C', 'UGREEN', 'L509', 20.00, NULL, 'En stock', 'assets/products/product-25-L509.jpeg', 'Cable Uno USB-C a USB-C • Carga rápida PD • Corriente máxima de 5A • Chip E-Marker • Transmisión de datos • Longitud de 2 m • Color morado', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable Uno USB-C a USB-C' AND p.model = 'L509' AND p.description IS NOT DISTINCT FROM 'Cable Uno USB-C a USB-C • Carga rápida PD • Corriente máxima de 5A • Chip E-Marker • Transmisión de datos • Longitud de 2 m • Color morado');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable Uno USB-C a USB-C', 'UGREEN', 'L509', 28.00, NULL, 'En stock', 'assets/products/product-26-L509.png', 'Cable Uno USB-C a USB-C • Carga rápida PD • Corriente máxima de 5A • Chip E-Marker • Transmisión de datos • Longitud de 3 m • Color negro', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable Uno USB-C a USB-C' AND p.model = 'L509' AND p.description IS NOT DISTINCT FROM 'Cable Uno USB-C a USB-C • Carga rápida PD • Corriente máxima de 5A • Chip E-Marker • Transmisión de datos • Longitud de 3 m • Color negro');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Estación de carga magnética Uno 2 en 1', 'UGREEN', 'W709', 68.00, NULL, 'En stock', 'assets/products/product-27-W709.png', 'Estación de carga magnética Uno 2 en 1 • Tecnología Ǫi2 • Carga inalámbrica para dos dispositivos compatibles', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Estación de carga magnética Uno 2 en 1' AND p.model = 'W709' AND p.description IS NOT DISTINCT FROM 'Estación de carga magnética Uno 2 en 1 • Tecnología Ǫi2 • Carga inalámbrica para dos dispositivos compatibles');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador Uno de 65W', 'UGREEN', 'CD361', 50.00, NULL, 'En stock', 'assets/products/product-28-CD361.jpeg', 'Cargador Uno de 65W • Tecnología GaN • 2 puertos USB-C + 1 USB-A • Pantalla LED con expresiones • Carga rápida para laptops, tablets y celulares • Color púrpura', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador Uno de 65W' AND p.model = 'CD361' AND p.description IS NOT DISTINCT FROM 'Cargador Uno de 65W • Tecnología GaN • 2 puertos USB-C + 1 USB-A • Pantalla LED con expresiones • Carga rápida para laptops, tablets y celulares • Color púrpura');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador Uno de 30W', 'UGREEN', 'CD359', 30.00, NULL, 'En stock', 'assets/products/product-29-CD359.jpeg', 'Cargador Uno de 30W • 1 puerto USB-C • Tecnología GaN • Carga rápida PD • Pantalla LED con expresiones • Diseño robot • Color púrpura', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador Uno de 30W' AND p.model = 'CD359' AND p.description IS NOT DISTINCT FROM 'Cargador Uno de 30W • 1 puerto USB-C • Tecnología GaN • Carga rápida PD • Pantalla LED con expresiones • Diseño robot • Color púrpura');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador Uno de 30W', 'UGREEN', 'CD359', 30.00, NULL, 'En stock', 'assets/products/product-30-CD359.png', 'Cargador Uno de 30W • Puerto USB-C • Tecnología GaN • Carga rápida PD • Enchufe americano • Color gris espacial', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador Uno de 30W' AND p.model = 'CD359' AND p.description IS NOT DISTINCT FROM 'Cargador Uno de 30W • Puerto USB-C • Tecnología GaN • Carga rápida PD • Enchufe americano • Color gris espacial');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador Uno de 100W', 'UGREEN', 'X688', 85.00, NULL, 'En stock', 'assets/products/product-33-X688.jpeg', 'Cargador Uno de 100W • Tecnología GaN • 3 puertos USB-C y 1 USB-A • Carga rápida PD • Enchufe americano • Color gris espacial', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador Uno de 100W' AND p.model = 'X688' AND p.description IS NOT DISTINCT FROM 'Cargador Uno de 100W • Tecnología GaN • 3 puertos USB-C y 1 USB-A • Carga rápida PD • Enchufe americano • Color gris espacial');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Resolución 4K UHD a 30 FPS', 'UGREEN', 'CM381', 60.00, NULL, 'En stock', 'assets/products/product-34-CM381.jpeg', 'Resolución 4K UHD a 30 FPS
Autofocus inteligente
Micrófonos duales con reducción de ruido
Corrección automática de iluminación', true, 'Micrófonos'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Resolución 4K UHD a 30 FPS' AND p.model = 'CM381' AND p.description IS NOT DISTINCT FROM 'Resolución 4K UHD a 30 FPS
Autofocus inteligente
Micrófonos duales con reducción de ruido
Corrección automática de iluminación');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador de 20W', 'UGREEN', 'X512', 14.00, NULL, 'En stock', 'assets/products/product-35-X512.jpeg', 'Cargador de 20W • Puerto USB-C • Tecnología GaN • Carga rápida • Enchufe americano fijo', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador de 20W' AND p.model = 'X512' AND p.description IS NOT DISTINCT FROM 'Cargador de 20W • Puerto USB-C • Tecnología GaN • Carga rápida • Enchufe americano fijo');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'El cargador rápido USB-C UGREEN de 30 W con tecnología GaN ofrece una conductividad térmica...', 'UGREEN', 'CD319', 25.00, NULL, 'En stock', 'assets/products/product-36-CD319.jpeg', 'El cargador rápido USB-C UGREEN de 30 W con tecnología GaN ofrece una conductividad térmica superior, lo que mejora la velocidad y la eficiencia de carga. Su tamaño se ha reducido a 25 x 12 x 4 cm y pesa  248 g.', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'El cargador rápido USB-C UGREEN de 30 W con tecnología GaN ofrece una conductividad térmica...' AND p.model = 'CD319' AND p.description IS NOT DISTINCT FROM 'El cargador rápido USB-C UGREEN de 30 W con tecnología GaN ofrece una conductividad térmica superior, lo que mejora la velocidad y la eficiencia de carga. Su tamaño se ha reducido a 25 x 12 x 4 cm y pesa  248 g.');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador de 25W', 'UGREEN', 'X517', 0.00, NULL, 'Agotado', 'assets/products/product-37-X517.jpeg', 'Cargador de 25W • Puerto USB-C • Tecnología GaN • Carga rápida • Enchufe americano fijo', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador de 25W' AND p.model = 'X517' AND p.description IS NOT DISTINCT FROM 'Cargador de 25W • Puerto USB-C • Tecnología GaN • Carga rápida • Enchufe americano fijo');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador de 45W', 'UGREEN', 'X524', 35.00, NULL, 'En stock', 'assets/products/product-38-X524.png', 'Cargador de 45W • Puerto USB-C • Tecnología GaN • Carga rápida PD • Enchufe americano fijo', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador de 45W' AND p.model = 'X524' AND p.description IS NOT DISTINCT FROM 'Cargador de 45W • Puerto USB-C • Tecnología GaN • Carga rápida PD • Enchufe americano fijo');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador de 45W', 'UGREEN', 'X614', 42.00, NULL, 'En stock', 'assets/products/product-39-X614.jpeg', 'Cargador de 45W • Tecnología GaN • Cable USB-C retráctil integrado • Carga rápida', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador de 45W' AND p.model = 'X614' AND p.description IS NOT DISTINCT FROM 'Cargador de 45W • Tecnología GaN • Cable USB-C retráctil integrado • Carga rápida');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador Nexode Pro de 65W', 'UGREEN', 'X755', 60.00, NULL, 'En stock', 'assets/products/product-40-X755.png', 'Cargador Nexode Pro de 65W • Tecnología GaN • 3 puertos • Carga rápida PD • Incluye cable • Enchufe americano', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador Nexode Pro de 65W' AND p.model = 'X755' AND p.description IS NOT DISTINCT FROM 'Cargador Nexode Pro de 65W • Tecnología GaN • 3 puertos • Carga rápida PD • Incluye cable • Enchufe americano');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador vehicular 130W', 'UGREEN', 'CD293', 55.00, NULL, 'En stock', 'assets/products/product-43-CD293.jpeg', 'Cargador vehicular 130W • 2×USB-C + USB-A • USB-C hasta 100W • Entrada 12/24V • Carga rápida • No incluye cable', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador vehicular 130W' AND p.model = 'CD293' AND p.description IS NOT DISTINCT FROM 'Cargador vehicular 130W • 2×USB-C + USB-A • USB-C hasta 100W • Entrada 12/24V • Carga rápida • No incluye cable');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Capturadora de video UGREEN HDMI a USB', 'UGREEN', 'CM489', 27.00, NULL, 'En stock', 'assets/products/product-44-CM489.jpeg', 'Capturadora de video UGREEN HDMI a USB • Resolución de captura hasta 1080p a 30 Hz • Conexión Plug and Play', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Capturadora de video UGREEN HDMI a USB' AND p.model = 'CM489' AND p.description IS NOT DISTINCT FROM 'Capturadora de video UGREEN HDMI a USB • Resolución de captura hasta 1080p a 30 Hz • Conexión Plug and Play');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Splitter HDMI', 'UGREEN', 'CM570', 41.00, NULL, 'En stock', 'assets/products/product-45-CM570.png', 'Splitter HDMI • 1 entrada HDMI y 4 salidas HDMI • Duplica la misma imagen en cuatro pantallas • Resolución  4K a 60 Hz • Ancho de banda de 18 Gbps • Compatible con HDR, 3D y HDCP 2.2', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Splitter HDMI' AND p.model = 'CM570' AND p.description IS NOT DISTINCT FROM 'Splitter HDMI • 1 entrada HDMI y 4 salidas HDMI • Duplica la misma imagen en cuatro pantallas • Resolución  4K a 60 Hz • Ancho de banda de 18 Gbps • Compatible con HDR, 3D y HDCP 2.2');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Hub Uno USB-C (6 en 1)', 'UGREEN', 'CM888', 40.00, NULL, 'En stock', 'assets/products/product-46-CM888.png', 'Hub Uno USB-C (6 en 1) • 1 HDMI 4K@60Hz • 2
USB-A 3.0 + 1 USB-A 2.0 + 1 USB-C de datos • 1
puerto Ethernet Gigabit de hasta 1.000 Mbps • 1 USB-C para carga rápida PD 100W', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Hub Uno USB-C (6 en 1)' AND p.model = 'CM888' AND p.description IS NOT DISTINCT FROM 'Hub Uno USB-C (6 en 1) • 1 HDMI 4K@60Hz • 2
USB-A 3.0 + 1 USB-A 2.0 + 1 USB-C de datos • 1
puerto Ethernet Gigabit de hasta 1.000 Mbps • 1 USB-C para carga rápida PD 100W');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Hub USB-A (4 en 1)', 'UGREEN', 'CR106', 9.00, NULL, 'En stock', 'assets/products/product-47-CR106.jpeg', 'Hub USB-A (4 en 1) • 4 puertos USB 2.0 • Velocidad de hasta 480 Mbps', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Hub USB-A (4 en 1)' AND p.model = 'CR106' AND p.description IS NOT DISTINCT FROM 'Hub USB-A (4 en 1) • 4 puertos USB 2.0 • Velocidad de hasta 480 Mbps');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Power Bank Nexode de 20.000 mAh', 'UGREEN', 'PB721', 105.00, NULL, 'En stock', 'assets/products/product-48-PB721.png', 'Power Bank Nexode de 20.000 mAh • Potencia total de hasta 130W • 2 puertos USB-C + 1 USB-A • Salida USB-C de hasta 100W • Pantalla digital inteligente • Capacidad de 72 Wh apta para avión', true, 'Power Banks'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Power Bank Nexode de 20.000 mAh' AND p.model = 'PB721' AND p.description IS NOT DISTINCT FROM 'Power Bank Nexode de 20.000 mAh • Potencia total de hasta 130W • 2 puertos USB-C + 1 USB-A • Salida USB-C de hasta 100W • Pantalla digital inteligente • Capacidad de 72 Wh apta para avión');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Power Bank Nexode de 25.000 mAh', 'UGREEN', 'PB722', 130.00, NULL, 'En stock', 'assets/products/product-49-PB722.png', 'Power Bank Nexode de 25.000 mAh • Potencia máxima de 200W • Pantalla digital • Capacidad de 90 Wh apta para avión', true, 'Power Banks'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Power Bank Nexode de 25.000 mAh' AND p.model = 'PB722' AND p.description IS NOT DISTINCT FROM 'Power Bank Nexode de 25.000 mAh • Potencia máxima de 200W • Pantalla digital • Capacidad de 90 Wh apta para avión');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Entrada: USB-C', 'UGREEN', 'CM481', 65.00, NULL, 'En stock', 'assets/products/product-50-CM481.jpeg', 'Entrada: USB-C
Puertos: 7 × USB-A 3.0
Velocidad de transferencia: Hasta 5 Gbps
Alimentación adicional: 12V
Compatibilidad: Windows y Mac
Función: Expansión de puertos USB', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Entrada: USB-C' AND p.model = 'CM481' AND p.description IS NOT DISTINCT FROM 'Entrada: USB-C
Puertos: 7 × USB-A 3.0
Velocidad de transferencia: Hasta 5 Gbps
Alimentación adicional: 12V
Compatibilidad: Windows y Mac
Función: Expansión de puertos USB');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Power Bank de 48.000 mAh', 'UGREEN', 'PB770', 195.00, NULL, 'En stock', 'assets/products/product-53-PB770.png', 'Power Bank de 48.000 mAh • Potencia máxima de 300W • Pantalla digital • Batería LiFePO4 • Luz integrada y modo SOS • Capacidad de 153 Wh', true, 'Power Banks'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Power Bank de 48.000 mAh' AND p.model = 'PB770' AND p.description IS NOT DISTINCT FROM 'Power Bank de 48.000 mAh • Potencia máxima de 300W • Pantalla digital • Batería LiFePO4 • Luz integrada y modo SOS • Capacidad de 153 Wh');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Rastreador inteligente Smart Finder', 'UGREEN', 'CM816', 20.00, NULL, 'En stock', 'assets/products/product-54-CM816.jpeg', 'Rastreador inteligente Smart Finder • Localización de objetos personales • Compatible solo con iOS', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Rastreador inteligente Smart Finder' AND p.model = 'CM816' AND p.description IS NOT DISTINCT FROM 'Rastreador inteligente Smart Finder • Localización de objetos personales • Compatible solo con iOS');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Soporte para tablet y celular de 4″–13″', 'UGREEN', 'LP134', 30.00, NULL, 'En stock', 'assets/products/product-55-LP134.jpeg', 'Soporte para tablet y celular de 4″–13″ • Base con giro 360° • Ángulo ajustable • Aluminio • Plegable
• Color Gris', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Soporte para tablet y celular de 4″–13″' AND p.model = 'LP134' AND p.description IS NOT DISTINCT FROM 'Soporte para tablet y celular de 4″–13″ • Base con giro 360° • Ángulo ajustable • Aluminio • Plegable
• Color Gris');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Power Bank Nexode de 10.000 mAh', 'UGREEN', 'PB727', 60.00, NULL, 'En stock', 'assets/products/product-56-PB727.jpeg', 'Power Bank Nexode de 10.000 mAh • Potencia máxima de 55W • Cable USB-C integrado • Pantalla digital • Capacidad de 37 Wh apta para avión', true, 'Power Banks'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Power Bank Nexode de 10.000 mAh' AND p.model = 'PB727' AND p.description IS NOT DISTINCT FROM 'Power Bank Nexode de 10.000 mAh • Potencia máxima de 55W • Cable USB-C integrado • Pantalla digital • Capacidad de 37 Wh apta para avión');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Power Bank Nexode de 20.000 mAh', 'UGREEN', 'PB723', 105.00, NULL, 'En stock', 'assets/products/product-57-PB723.jpeg', 'Power Bank Nexode de 20.000 mAh • Potencia máxima de 130W • Cable USB-C integrado • Pantalla digital • Capacidad de 72 Wh apta para avión', true, 'Power Banks'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Power Bank Nexode de 20.000 mAh' AND p.model = 'PB723' AND p.description IS NOT DISTINCT FROM 'Power Bank Nexode de 20.000 mAh • Potencia máxima de 130W • Cable USB-C integrado • Pantalla digital • Capacidad de 72 Wh apta para avión');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Capacidad máxima: Hasta 8 TB de almacenamiento', 'UGREEN', 'CM767', 26.00, NULL, 'En stock', 'assets/products/product-58-CM767.jpeg', 'Capacidad máxima: Hasta 8 TB de almacenamiento .
Interfaz: USB 3.2 Gen 2 con conector USB-C.', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Capacidad máxima: Hasta 8 TB de almacenamiento' AND p.model = 'CM767' AND p.description IS NOT DISTINCT FROM 'Capacidad máxima: Hasta 8 TB de almacenamiento .
Interfaz: USB 3.2 Gen 2 con conector USB-C.');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'EXT USB 3.0 SuperSpeed ​​de hasta 5 Gbps,', 'UGREEN', 'US129', 6.00, NULL, 'En stock', 'assets/products/product-59-US129.jpeg', 'EXT USB 3.0 SuperSpeed ​​de hasta 5 Gbps,
Diseño plug-and-play de 1,5 m de longitud', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'EXT USB 3.0 SuperSpeed ​​de hasta 5 Gbps,' AND p.model = 'US129' AND p.description IS NOT DISTINCT FROM 'EXT USB 3.0 SuperSpeed ​​de hasta 5 Gbps,
Diseño plug-and-play de 1,5 m de longitud');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'EXT USB 2.0 tipo A macho a tipo A hembra', 'UGREEN', 'US103', 4.00, NULL, 'En stock', 'assets/products/product-60-US103.jpeg', 'EXT USB 2.0 tipo A macho a tipo A hembra
Velocidad de hasta 480 Mbps
Compatibilidad universal - 2M', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'EXT USB 2.0 tipo A macho a tipo A hembra' AND p.model = 'US103' AND p.description IS NOT DISTINCT FROM 'EXT USB 2.0 tipo A macho a tipo A hembra
Velocidad de hasta 480 Mbps
Compatibilidad universal - 2M');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'EXT USB 2.0 tipo A macho a tipo A hembra', 'UGREEN', 'US103', 5.00, NULL, 'En stock', 'assets/products/product-63-US103.jpeg', 'EXT USB 2.0 tipo A macho a tipo A hembra
Velocidad de hasta 480 Mbps
Compatibilidad universal - 3M', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'EXT USB 2.0 tipo A macho a tipo A hembra' AND p.model = 'US103' AND p.description IS NOT DISTINCT FROM 'EXT USB 2.0 tipo A macho a tipo A hembra
Velocidad de hasta 480 Mbps
Compatibilidad universal - 3M');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'EXT USB 2.0 tipo A macho a tipo A hembra', 'UGREEN', 'US103', 9.00, NULL, 'En stock', 'assets/products/product-64-US103.jpeg', 'EXT USB 2.0 tipo A macho a tipo A hembra
Velocidad de hasta 480 Mbps
Compatibilidad universal - 5M', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'EXT USB 2.0 tipo A macho a tipo A hembra' AND p.model = 'US103' AND p.description IS NOT DISTINCT FROM 'EXT USB 2.0 tipo A macho a tipo A hembra
Velocidad de hasta 480 Mbps
Compatibilidad universal - 5M');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'EXT USB 3.0 SuperSpeed ​​de hasta 5 Gbps,', 'UGREEN', 'US129', 9.00, NULL, 'En stock', 'assets/products/product-65-US129.jpeg', 'EXT USB 3.0 SuperSpeed ​​de hasta 5 Gbps,
Diseño plug-and-play de 3 m de longitud', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'EXT USB 3.0 SuperSpeed ​​de hasta 5 Gbps,' AND p.model = 'US129' AND p.description IS NOT DISTINCT FROM 'EXT USB 3.0 SuperSpeed ​​de hasta 5 Gbps,
Diseño plug-and-play de 3 m de longitud');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Marca: UGREEN', 'UGREEN', '10553', 12.00, NULL, 'En stock', 'assets/products/product-66-10553.jpeg', 'Marca: UGREEN
Modelo: Micro HDMI – HDMI Hembra
Producto: Adaptador
Conectores: Micro HDMI a HDMI Hembra
Resolución: 4K', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Marca: UGREEN' AND p.model = '10553' AND p.description IS NOT DISTINCT FROM 'Marca: UGREEN
Modelo: Micro HDMI – HDMI Hembra
Producto: Adaptador
Conectores: Micro HDMI a HDMI Hembra
Resolución: 4K');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Categoría: CAT 6', 'UGREEN', 'NW101', 4.00, NULL, 'En stock', 'assets/products/product-67-NW101.jpeg', 'Categoría: CAT 6
Longitud: 3 metros
Conectores RJ45
Diseño plano y flexible
Velocidad hasta 1 Gbps', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Categoría: CAT 6' AND p.model = 'NW101' AND p.description IS NOT DISTINCT FROM 'Categoría: CAT 6
Longitud: 3 metros
Conectores RJ45
Diseño plano y flexible
Velocidad hasta 1 Gbps');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Marca: UGREEN', 'UGREEN', '70577', 8.00, NULL, 'En stock', 'assets/products/product-68-70577.jpeg', 'Marca: UGREEN
Modelo: 70577
Tipo: Estuche protector para auriculares
Material: Tela resistente de alta calidad
Color: Gris', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Marca: UGREEN' AND p.model = '70577' AND p.description IS NOT DISTINCT FROM 'Marca: UGREEN
Modelo: 70577
Tipo: Estuche protector para auriculares
Material: Tela resistente de alta calidad
Color: Gris');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Marca: UGREEN', 'UGREEN', 'US129', 14.00, NULL, 'En stock', 'assets/products/product-69-US129.jpeg', 'Marca: UGREEN
Modelo: LP128 (40707)
Tipo: Bolsa de transporte para disco duro externo de 2,5 pulgadas
Dimensiones exteriores: 17,3 cm x 10,3 cm x 4,4 cm', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Marca: UGREEN' AND p.model = 'US129' AND p.description IS NOT DISTINCT FROM 'Marca: UGREEN
Modelo: LP128 (40707)
Tipo: Bolsa de transporte para disco duro externo de 2,5 pulgadas
Dimensiones exteriores: 17,3 cm x 10,3 cm x 4,4 cm');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Conector: Niquelado', 'UGREEN', 'CM620', 41.00, NULL, 'En stock', 'assets/products/product-70-CM620.jpeg', 'Conector: Niquelado
Chip: IT6662E
Compatibilidad: HDCP
Resolución: 4K
Frecuencia de actualización: 30 Hz
Accesorios: Fuente de alimentación de 5V/2A', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Conector: Niquelado' AND p.model = 'CM620' AND p.description IS NOT DISTINCT FROM 'Conector: Niquelado
Chip: IT6662E
Compatibilidad: HDCP
Resolución: 4K
Frecuencia de actualización: 30 Hz
Accesorios: Fuente de alimentación de 5V/2A');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT '【Carga rápida PD de 20 W】: Para fabricar el cable USB-C a Lightning compatible con la carga...', 'UGREEN', 'us304', 30.00, NULL, 'En stock', 'assets/products/product-73-us304.png', '【Carga rápida PD de 20 W】: Para fabricar el cable USB-C a Lightning compatible con la carga rápida PD de 9 V/2 A y 18 W (máx.), se requiere un nuevo conector Lightning C94.', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = '【Carga rápida PD de 20 W】: Para fabricar el cable USB-C a Lightning compatible con la carga...' AND p.model = 'us304' AND p.description IS NOT DISTINCT FROM '【Carga rápida PD de 20 W】: Para fabricar el cable USB-C a Lightning compatible con la carga rápida PD de 9 V/2 A y 18 W (máx.), se requiere un nuevo conector Lightning C94.');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Audio de alta resolución: fidelidad de 24 bits/96 kHz', 'UGREEN', 'cm721', 29.00, NULL, 'En stock', 'assets/products/product-74-cm721.png', 'Audio de alta resolución: fidelidad de 24 bits/96 kHz
Carga PD simultánea: Carga mientras usas el audio.
Plug & Play: No se necesitan controladores.
Compatibilidad universal: iPad Pro, MacBook, Samsung', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Audio de alta resolución: fidelidad de 24 bits/96 kHz' AND p.model = 'cm721' AND p.description IS NOT DISTINCT FROM 'Audio de alta resolución: fidelidad de 24 bits/96 kHz
Carga PD simultánea: Carga mientras usas el audio.
Plug & Play: No se necesitan controladores.
Compatibilidad universal: iPad Pro, MacBook, Samsung');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador Uno de 65W', 'UGREEN', 'CD361', 50.00, NULL, 'En stock', 'assets/products/product-75-CD361.jpeg', 'Cargador Uno de 65W • Tecnología GaN • 2 puertos USB-C + 1 USB-A • Pantalla LED con expresiones • Carga rápida para laptops, tablets y celulares • Color púrpura', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador Uno de 65W' AND p.model = 'CD361' AND p.description IS NOT DISTINCT FROM 'Cargador Uno de 65W • Tecnología GaN • 2 puertos USB-C + 1 USB-A • Pantalla LED con expresiones • Carga rápida para laptops, tablets y celulares • Color púrpura');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cargador Uno de 30W', 'UGREEN', 'CD359', 30.00, NULL, 'En stock', 'assets/products/product-76-CD359.jpeg', 'Cargador Uno de 30W • 1 puerto USB-C • Tecnología GaN • Carga rápida PD • Pantalla LED con expresiones • Diseño robot • Color púrpura', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cargador Uno de 30W' AND p.model = 'CD359' AND p.description IS NOT DISTINCT FROM 'Cargador Uno de 30W • 1 puerto USB-C • Tecnología GaN • Carga rápida PD • Pantalla LED con expresiones • Diseño robot • Color púrpura');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Ugreen usb externo de audio 15cm', 'UGREEN', 'CM129', 20.00, NULL, 'En stock', 'assets/products/product-77-CM129.jpeg', 'Ugreen usb externo de audio 15cm', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Ugreen usb externo de audio 15cm' AND p.model = 'CM129' AND p.description IS NOT DISTINCT FROM 'Ugreen usb externo de audio 15cm');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'USB 2.0 HUB 4 Puertos', 'UGREEN', 'CR106', 8.50, NULL, 'En stock', 'assets/products/product-78-CR106.jpeg', 'USB 2.0 HUB 4 Puertos', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'USB 2.0 HUB 4 Puertos' AND p.model = 'CR106' AND p.description IS NOT DISTINCT FROM 'USB 2.0 HUB 4 Puertos');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Convertidor Mini Display Port A Hdmi Y Vga', 'UGREEN', 'MD115', 23.00, NULL, 'En stock', 'assets/products/product-79-MD115.png', 'Convertidor Mini Display Port A Hdmi Y Vga', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Convertidor Mini Display Port A Hdmi Y Vga' AND p.model = 'MD115' AND p.description IS NOT DISTINCT FROM 'Convertidor Mini Display Port A Hdmi Y Vga');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Ugreen Usb - C Enclouser Disco 6gb', 'UGREEN', '50743', 17.00, NULL, 'En stock', 'assets/products/product-80-50743.jpeg', 'Ugreen Usb - C Enclouser Disco 6gb', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Ugreen Usb - C Enclouser Disco 6gb' AND p.model = '50743' AND p.description IS NOT DISTINCT FROM 'Ugreen Usb - C Enclouser Disco 6gb');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Base para celular 360', 'UGREEN', 'Lp805', 14.00, NULL, 'En stock', 'assets/products/product-83-Lp805.jpeg', 'Base para celular 360', true, 'Varios'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Base para celular 360' AND p.model = 'Lp805' AND p.description IS NOT DISTINCT FROM 'Base para celular 360');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable UGREEN de 1,5 metros, USB-C a HDMI macho, carcasa de aluminio - MM142 – 50570', 'UGREEN', 'MM142', 24.00, NULL, 'En stock', 'assets/products/product-84-MM142.jpeg', 'Cable UGREEN de 1,5 metros, USB-C a HDMI macho, carcasa de aluminio - MM142 – 50570', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable UGREEN de 1,5 metros, USB-C a HDMI macho, carcasa de aluminio - MM142 – 50570' AND p.model = 'MM142' AND p.description IS NOT DISTINCT FROM 'Cable UGREEN de 1,5 metros, USB-C a HDMI macho, carcasa de aluminio - MM142 – 50570');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Cable USB-C a Micro B UGREEN de 1 metro (negro)', 'UGREEN', '20103', 7.00, NULL, 'En stock', 'assets/products/product-85-20103.jpeg', 'Cable USB-C a Micro B UGREEN de 1 metro (negro)', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Cable USB-C a Micro B UGREEN de 1 metro (negro)' AND p.model = '20103' AND p.description IS NOT DISTINCT FROM 'Cable USB-C a Micro B UGREEN de 1 metro (negro)');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Power Bank PB536', 'UGREEN', 'PB536', 85.00, NULL, 'En stock', 'assets/products/product-86-PB536.jpeg', 'Carga rápida de 45 W para portátiles, tabletas y teléfonos.
Cable USB-C integrado para mayor comodidad
Batería de alta capacidad para múltiples cargas
Puertos USB-C y USB-A adicionales para cargar varios dispositivos.', true, 'Power Banks'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Power Bank PB536' AND p.model = 'PB536' AND p.description IS NOT DISTINCT FROM 'Carga rápida de 45 W para portátiles, tabletas y teléfonos.
Cable USB-C integrado para mayor comodidad
Batería de alta capacidad para múltiples cargas
Puertos USB-C y USB-A adicionales para cargar varios dispositivos.');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Power Bank PB205', 'UGREEN', 'PB205', 120.00, NULL, 'En stock', 'assets/products/product-87-PB205.png', 'Carga Rápida de 145W] Con las últimas tecnologías PD3.0 y QC3.0, puede alcanzar la velocidad de carga súper rápida de 140W de un solo puerto, que carga el 56% del MacBook Pro en 30 minutos y 50% del iPhoone 16 en 30min. Utilice 2 puertos USB C simultáneamente, este banco de energía podría ofrecer una potencia de hasta 145W en total.', true, 'Power Banks'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Power Bank PB205' AND p.model = 'PB205' AND p.description IS NOT DISTINCT FROM 'Carga Rápida de 145W] Con las últimas tecnologías PD3.0 y QC3.0, puede alcanzar la velocidad de carga súper rápida de 140W de un solo puerto, que carga el 56% del MacBook Pro en 30 minutos y 50% del iPhoone 16 en 30min. Utilice 2 puertos USB C simultáneamente, este banco de energía podría ofrecer una potencia de hasta 145W en total.');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17', 'Anker', '45W', 45.00, NULL, 'En stock', 'assets/products/product-94-45W.jpeg', 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17' AND p.model = '45W' AND p.description IS NOT DISTINCT FROM 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17', 'Anker', '45W', 45.00, NULL, 'En stock', 'assets/products/product-95-45W.jpeg', 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17' AND p.model = '45W' AND p.description IS NOT DISTINCT FROM 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17', 'Anker', '45W', 45.00, NULL, 'En stock', 'assets/products/product-96-45W.jpeg', 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17', true, 'Cargadores'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17' AND p.model = '45W' AND p.description IS NOT DISTINCT FROM 'Anker Nano Smart Display Charger, 45W Max Fast Charger USB C para iPhone 17');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'CARGADOR PORTATIL ANKER / 633 MAGNETIC       Puertos: USB-C', 'Anker', '663', 69.00, NULL, 'En stock', 'assets/products/product-97-663.png', 'CARGADOR PORTATIL ANKER / 633 MAGNETIC       Puertos: USB-C
• Carga inalámbrica: sí (magnética) 7.5W
• Potencia de salida: hasta 20W (por cable, según dispositivo)', true, 'Power Banks'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'CARGADOR PORTATIL ANKER / 633 MAGNETIC       Puertos: USB-C' AND p.model = '663' AND p.description IS NOT DISTINCT FROM 'CARGADOR PORTATIL ANKER / 633 MAGNETIC       Puertos: USB-C
• Carga inalámbrica: sí (magnética) 7.5W
• Potencia de salida: hasta 20W (por cable, según dispositivo)');

INSERT INTO public.products (name, brand, model, price, old_price, stock, image_url, description, active, category)
SELECT 'Anker Cable 322 USB-C a Lightning trenzado con certificación MFi para iPhone 15, 14, 13, 12,...', 'Anker', '322', 21.00, NULL, 'En stock', 'assets/products/product-98-322.jpeg', 'Anker Cable 322 USB-C a Lightning trenzado con certificación MFi para iPhone 15, 14, 13, 12, 11, iPad, AirPods, cable duradero de sincronización de datos de carga rápida, color negro, 6 pies, 2M', true, 'Cables'
WHERE NOT EXISTS (SELECT 1 FROM public.products p WHERE p.name = 'Anker Cable 322 USB-C a Lightning trenzado con certificación MFi para iPhone 15, 14, 13, 12,...' AND p.model = '322' AND p.description IS NOT DISTINCT FROM 'Anker Cable 322 USB-C a Lightning trenzado con certificación MFi para iPhone 15, 14, 13, 12, 11, iPad, AirPods, cable duradero de sincronización de datos de carga rápida, color negro, 6 pies, 2M');
