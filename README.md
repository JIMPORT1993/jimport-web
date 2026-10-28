# JIMPORT — sitio web y catálogo editable

## Arquitectura (tres servicios)
1. **GitHub**: guardar el código.
2. **Supabase**: base de datos de productos y acceso de administrador.
3. **Vercel**: publicar el sitio web.

La tienda pública muestra los productos activos. El panel `admin.html` permite iniciar sesión, añadir, editar precios/descripciones/imágenes y eliminar productos. El botón flotante y los botones de producto abren WhatsApp.

## Configuración completa

### 1) Crear base de datos en Supabase
1. Entra en https://supabase.com y crea un proyecto llamado `jimport-catalogo`.
2. Guarda la contraseña de base de datos en un lugar seguro.
3. Abre **SQL Editor → New query**.
4. Copia todo el contenido de `schema.sql`, pégalo y pulsa **Run**.
5. Ve a **Project Settings → API** (o **Connect**) y copia el Project URL y la clave pública `anon`/`publishable`. Nunca uses la clave `service_role` en la web.

### 2) Crear usuario administrador
1. En Supabase abre **Authentication → Users → Add user**.
2. Crea el correo y contraseña que usarás para administrar JIMPORT.
3. Desactiva el registro público si aparece habilitado en Authentication settings. El administrador se crea desde el panel de Supabase, no desde la tienda.
4. Guarda las credenciales de forma segura.

### 3) Configurar el sitio
Abre `config.js` y cambia:
- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_ANON_KEY`: clave pública `anon` o `publishable`.
- `WHATSAPP_NUMBER`: número comercial con código de país, solo números. Para Ecuador, usa `593` seguido del número sin el primer `0`. Ejemplo de formato: `593991234567` (reemplázalo por el número real).
No publiques contraseñas de administrador ni claves `service_role`.

### 4) Publicar con GitHub + Vercel
1. Crea un repositorio en https://github.com, por ejemplo `jimport-web`.
2. Sube estos archivos a la raíz del repositorio: `index.html`, `admin.html`, `styles.css`, `config.js`, `app.js`, `admin.js`, `schema.sql`, `README.md`.
3. Entra en https://vercel.com y elige **Add New → Project**. Importa el repositorio `jimport-web`.
4. Framework preset: **Other**. Build command: déjalo vacío. Output directory: `.` (punto). Si Vercel exige un ajuste distinto, usa la configuración estática predeterminada.
5. Pulsa **Deploy**. Cada cambio que subas a GitHub se publicará automáticamente.
6. Tu tienda queda en la URL que te entrega Vercel; el panel será `https://TU-DOMINIO/admin.html`.

### 5) Prueba de funcionamiento
- Abre la tienda y comprueba que se carguen los productos.
- Abre `/admin.html`, inicia sesión y añade un producto de prueba.
- Comprueba que aparezca en la página principal.
- Edita el precio y luego elimina el producto de prueba.
- Prueba los botones de WhatsApp desde celular y computadora.

## Uso diario
- Para añadir o cambiar productos, entra a `/admin.html`.
- Para editar un precio, pulsa **Editar** en ese producto.
- Para quitar un producto, pulsa **Eliminar** y confirma.
- Para ocultar temporalmente un producto sin borrarlo, la versión inicial no incluye un botón de ocultar; se puede ampliar desde el panel de datos. La tienda solo muestra productos con `active = true`.
- Las imágenes deben estar en una URL pública HTTPS. Puedes usar enlaces directos de imágenes alojadas en un servicio público que permita hotlinking.

## Antes de lanzar
- Cambia el número de WhatsApp en `config.js`.
- Reemplaza los productos de ejemplo: solo se muestran cuando Supabase no está configurado; una vez conectado, la web lee la base de datos.
- Añade precios reales, imágenes y políticas comerciales.
- Revisa las políticas RLS de Supabase. Este proyecto usa la autenticación para escritura y deja lectura pública de productos activos. Para una tienda de mayor riesgo, restringe escritura a un rol/tabla de administradores.


## Mejoras visuales incluidas
- Portada con carrusel automático de productos del catálogo (cambia cada 4,5 segundos) y controles manuales.
- Logos de UGREEN y Anker visibles en la página inicial.
- Logo JIMPORT provisional en `assets/logo-jimport.svg`. Reemplaza ese archivo por tu logo original manteniendo el mismo nombre y formato SVG, o cambia la ruta en `index.html` y `admin.html`.
- En el panel de administración, cambia **Disponibilidad** a **Agotado** para mostrar “Producto no disponible” y una capa visual de agotado en la tienda.
- Las imágenes de productos se adaptan al tamaño disponible y usan `object-fit: contain` para evitar recortes o deformaciones.


## Publicar la versión corregida

Este ZIP está organizado para que `index.html` quede directamente en la raíz del sitio. Sube el contenido completo de este ZIP (incluida la carpeta `assets`) a la carpeta pública de tu hosting, reemplazando los archivos anteriores. No subas la carpeta contenedora del ZIP como una carpeta adicional. El logo principal se encuentra en `assets/logo-jimport.png` y se utiliza en la portada y el pie de página; el panel de administración también usa ese mismo archivo.


## Promociones editables en portada
1. En Supabase abre **SQL Editor** y ejecuta el archivo `schema.sql` actualizado. Esto crea la tabla `promotions` además de la tabla de productos existente.
2. Publica los archivos actualizados en GitHub y espera el despliegue de Vercel.
3. Abre `admin.html`, inicia sesión y usa **Añadir promoción**. Completa título, imagen (URL pública https://), descripción y enlace opcional.
4. Activa **Mostrar en la portada** y guarda. Las promociones activas aparecen en la portada y rotan cada 3 segundos. Desde el panel puedes editar, ocultar o eliminar promociones.
5. Para las imágenes de productos, pega una URL directa a la imagen. Se mostrarán dentro del marco sin deformarse ni salirse.

No borres `config.js`: conserva la configuración de Supabase y WhatsApp de tu tienda.


## Importar productos desde el Excel

El paquete incluye 70 registros de productos con sus imágenes extraídas del Excel y las características de la columna DESCRIPCIÓN. El precio se tomó únicamente de la columna I (PRECIO NORMAL); no se usó el precio LIVE de la columna J ni se configuró precio anterior.

1. Sube todos los archivos del ZIP al mismo directorio del sitio web, incluyendo `assets/products/`.
2. En Supabase, abre **SQL Editor**.
3. Si aún no configuraste las tablas, ejecuta primero `schema.sql`.
4. Ejecuta `IMPORTAR_PRODUCTOS.sql` para cargar los productos. El script evita volver a insertar productos que ya coincidan en nombre, modelo y descripción.
5. Abre la tienda y recarga la página. Las imágenes usan rutas relativas `assets/products/...`, así que esa carpeta debe permanecer junto al sitio web.

`productos_importados.csv` contiene un listado de revisión con modelo, categoría, descripción, precio usado y archivo de imagen.

Las categorías del catálogo se ajustaron a: Cables, Cargadores, Power Banks, Teclados mecánicos, Micrófonos y Varios. Los productos que no pertenecen claramente a las cinco primeras categorías quedan en Varios.
