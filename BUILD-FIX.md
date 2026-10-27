# Build fix — Ministerio Redención y Vida

## Corrección crítica

Se corrigió `frontend/src/admin/Content.jsx`, donde un fragment (`<>...</>`) estaba abierto dentro de un `<label>` y provocaba el error de Vite/esbuild:

- `Unexpected closing "label" tag does not match opening fragment tag`
- `Unexpected closing "form" tag does not match opening "label" tag`

El formulario fue reestructurado con JSX semántico y accesible: cada campo usa un contenedor independiente y su `<label>` se asocia mediante `htmlFor`.

## Robustez adicional

- El ciclo de carga de contenido mantiene `useEffect` sin devolver Promises.
- Se evita el anidamiento inválido de `<label>` en la configuración administrativa.
- Los botones de edición/eliminación declaran explícitamente `type="button"`.
- El formulario conserva manejo de errores y estado de guardado.

## Construcción

Después de reemplazar el proyecto, ejecutar:

```powershell
docker compose down
docker compose build --no-cache
docker compose up -d
docker compose ps
curl http://localhost:8080/api/health
```

No usar `docker compose down -v` si se desean conservar los datos de PostgreSQL.


## Corrección responsive + carga de videos
- Administración responsive para teléfonos y tablets con menú superior y navegación horizontal.
- La sección Videos permite cargar archivos desde PC, Android y iPhone/iPad mediante el selector nativo del dispositivo.
- MP4 recomendado; también WebM, MOV/M4V, MKV y OGG.
- El backend guarda el video en `/uploads/` y `videos.video_url` apunta al archivo.
- Nginx y Multer soportan hasta 250 MB por defecto mediante `MAX_UPLOAD_MB`.
- Los videos se reproducen con `<video controls playsInline>` tanto en administración como en la página pública.
