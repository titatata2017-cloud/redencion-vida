# Ministerio Redención y Vida — Enterprise

Plataforma full-stack para el Ministerio Redención y Vida: React/Vite/Tailwind + Node/Express + PostgreSQL + JWT + Nginx + Docker Compose.

## Funciones principales
- Página de inicio con actividades, testimonios, estudios, videos, cuestionario y alabanzas MP3.
- **Versículo bíblico + explicación**, completamente editable desde Administración.
- **Ubicación de la iglesia + cómo llegar**, dirección, horarios, mapa y enlaces editables desde Administración.
- **Donaciones funcionales** mediante una página interna `/donate`: efectivo, transferencia bancaria en República Dominicana, donación en línea y otros medios configurables.
- En transferencias de República Dominicana se publican **banco, tipo de cuenta y número de cuenta**; opcionalmente SWIFT/BIC para operaciones internacionales. La interfaz no usa “CBU” como si fuera un identificador bancario dominicano.
- WhatsApp flotante en todas las ventanas.
- Fondo visual inspirado en la bandera de República Dominicana y logo del ministerio.
- Panel `/admin` para gestionar contenidos, usuarios y configuración pública.
- Roles `ADMIN` y `EDITOR`, contraseñas con bcrypt y JWT.
- Subida de imágenes y audio.
- Manejo centralizado de errores y Error Boundary en frontend.
- Healthcheck, proxy `/api`, persistencia PostgreSQL y volumen de uploads.

## Corrección crítica incluida
El error `TypeError: n is not a function` provenía de varios `useEffect` que recibían directamente funciones que devolvían una Promise (`useEffect(load, [])`). React interpreta el valor retornado como una función de limpieza; al desmontar o ejecutar StrictMode podía intentar invocar la Promise. Todos esos efectos fueron convertidos a callbacks que no retornan la Promise y además tienen manejo de cancelación/errores.

## Actualización sin borrar la base de datos
No uses `docker compose down -v` si quieres conservar los datos. La versión actual incorpora `ensureSettings()` en el backend para crear de forma idempotente los nuevos ajustes de versículo, ubicación y donaciones incluso cuando el volumen PostgreSQL ya existe.

## Ejecutar
1. Copia `.env.example` a `.env` y cambia las claves.
2. `docker compose down`
3. `docker compose build --no-cache`
4. `docker compose up -d`
5. `docker compose ps`
6. `curl http://localhost:8080/api/health`
7. Abre `http://localhost:8080`
8. Administración: `http://localhost:8080/admin/login`

## Configurar el sitio desde Administración
En **Administración → Configuración** se pueden editar:
- Identidad y portada.
- Versículo, referencia, texto y explicación.
- Dirección, ciudad/provincia, horarios, teléfono, URL de mapa y URL de “Cómo llegar”.
- Efectivo.
- Transferencia bancaria RD: banco, titular, tipo, número de cuenta, cédula/RNC, moneda, SWIFT/BIC e instrucciones.
- Donación en línea mediante URL de pago.
- Otro medio de donación.
- WhatsApp, email y redes sociales.

Después de guardar, los cambios aparecen en la página pública sin modificar código.

## Credenciales
Usa `ADMIN_EMAIL` y `ADMIN_PASSWORD` definidos en `.env`. Cambia la contraseña inicial después del primer acceso.


## Administración móvil y videos
La administración dispone de navegación responsive para teléfonos y tablets. La sección **Videos** permite seleccionar videos desde computadora o celular y subir MP4, WebM, MOV/QuickTime y OGG; MP4 es el formato recomendado. El límite predeterminado de subida es 250 MB y puede cambiarse mediante `MAX_UPLOAD_MB`. Los videos subidos se reproducen directamente en la web con controles y soporte móvil.
