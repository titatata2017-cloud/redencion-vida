# Redención y Vida — corrección UI responsive y Google Maps

## Cambios de esta versión

- La portada móvil muestra el logo institucional antes del título “Bienvenidos al Ministerio Redención y Vida”.
- Se conserva el logo inferior de la portada; la captura anterior no representa el final completo de la página.
- El hero mantiene una composición profesional para escritorio y una composición vertical para teléfonos.
- La página `Ubicación` ahora acepta en Administración:
  - URL de inserción de Google Maps.
  - Código completo `<iframe ...>` copiado desde Google Maps.
- El frontend extrae automáticamente el atributo `src` cuando se pega el iframe completo.
- Se valida que el mapa utilice únicamente URLs HTTP/HTTPS.
- El iframe utiliza `loading="lazy"`, `allowFullScreen` y una política de referrer apropiada.
- El mapa es responsive y se adapta a escritorio, tablet y teléfono sin desbordamiento horizontal.
- Se endureció el manejo de enlaces externos de “Cómo llegar” y “Abrir mapa”.
- Se agregó una configuración inicial del mapa suministrado para instalaciones nuevas.

## Nota sobre instalaciones existentes

No se elimina ni se modifica el volumen PostgreSQL. Si el mapa ya está guardado como código `<iframe>...</iframe>`, la nueva interfaz lo interpreta automáticamente, por lo que no es necesario borrar datos.

## Validación realizada

- `backend/src/server.js`: sintaxis Node válida.
- Todos los archivos JS/JSX de `frontend/src`: sintaxis válida mediante parser JSX.
- El build completo de Vite no pudo ejecutarse en este entorno porque el `node_modules` incluido en el ZIP original corresponde a otro sistema operativo y carece del binario Linux de Rollup. Docker reinstalará las dependencias correctamente durante `docker compose build`.
