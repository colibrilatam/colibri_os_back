# Configuración y variables de entorno

## Cómo arranca la aplicación

`ConfigModule` (NestJS) carga `.env` y valida su contenido contra un esquema
(`src/config/env.validation.ts`) **antes** de que la app termine de levantar.
Si una variable falta o es inválida, el proceso no arranca: se loguea el
nombre de la variable y la regla incumplida (nunca el valor) y el proceso
termina con código de salida distinto de cero. Ver `bootstrap().catch(...)`
en `src/main.ts`.

## Variables obligatorias y opcionales

| Variable | Obligatoria | Regla de validación |
| --- | --- | --- |
| `NODE_ENV` | Sí (default `development`) | `development \| test \| staging \| production` |
| `PORT` | No (default `3000`) | entero 1–65535 |
| `DATABASE_URL` | Sí | debe iniciar con `postgres://` o `postgresql://` |
| `DATABASE_SSL` | No | `true`/`false`; **no puede ser `false` en producción** |
| `JWT_SECRET` | Sí | mínimo 32 caracteres |
| `JWT_EXPIRES_IN` | Sí | formato de duración (`15m`, `1h`, `7d`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Sí | no vacíos |
| `GOOGLE_CALLBACK_URL` | Sí | URL válida |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Sí | no vacíos |
| `FRONTEND_URL` | Sí | URL válida |
| `FRONTEND_URLS` | No | lista de URLs separadas por coma, todas válidas |
| `SWAGGER_ENABLED`, `MAINTENANCE_MODE` | No | `true`/`false` |
| `CONFIRM_DESTRUCTIVE_SEED` | No | **no puede ser `true` en producción** |
| `MAX_JSON_BODY_SIZE` | No (default `1mb`) | formato de tamaño (`1mb`, `512kb`) |
| `MAX_PROJECT_IMAGE_BYTES`, `REQUEST_TIMEOUT_MS`, `SOCKET_TIMEOUT_MS`, `OAUTH_STATE_COOKIE_MAX_AGE_MS`, `OAUTH_EXCHANGE_CODE_TTL_MS` | No | enteros positivos |

Ver `.env.example` para valores de referencia locales y el detalle completo
de reglas en `src/config/env.validation.ts` y sus pruebas en
`src/config/env.validation.spec.ts`.

## Buenas prácticas

- No commitear `.env` ni secretos reales. `.env.example` solo contiene
  placeholders.
- Los secretos de cada ambiente (Render, CI) se cargan desde el gestor de
  secretos de la plataforma correspondiente, nunca desde el repositorio.
- Ningún log de la aplicación debe imprimir el valor de una variable
  sensible; los errores de validación de entorno solo exponen el **nombre**
  de la variable y la regla incumplida.

## Relación con otros documentos

- [Arquitectura](architecture.md): cómo `ConfigModule` se integra con el resto de los módulos.
- [Runbook de despliegue](runbooks/deployment.md): qué variables deben estar cargadas en Render antes de liberar.
- [CI/CD](ci-cd.md): en qué job de CI se validan estas variables antes de mergear.