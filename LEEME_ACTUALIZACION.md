# JIMPORT — actualización de guardado y limpieza

## Cambios
- La edición de productos ahora se guarda únicamente al pulsar **Guardar producto**.
- Se eliminó el guardado automático por temporizador, que podía enviar cambios mientras se completaba el formulario.
- La operación comprueba la respuesta de `public.products` y el guardado del inventario privado.
- Se muestran mensajes específicos si faltan columnas o permisos en Supabase.
- El precio mayorista vacío toma el precio público como valor predeterminado.

## Instalación
1. Reemplaza los archivos del proyecto en GitHub con el contenido de esta carpeta.
2. No borres ni recrees las tablas de Supabase.
3. No se requiere SQL nuevo para esta corrección. Conserva y ejecuta las migraciones SQL anteriores solo si todavía no las has aplicado.
4. Recarga el administrador con Ctrl + F5.

## Limpieza
Se retiraron notas/bocetos `.txt`, documentación antigua `.md`, hojas CSS alternativas que no se cargaban y un JavaScript móvil legado no referenciado. Se conservaron las hojas CSS activas por separado para no alterar su orden de cascada, todos los scripts activos, imágenes, configuración y archivos SQL.
