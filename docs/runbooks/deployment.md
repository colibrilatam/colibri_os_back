# Runbook de despliegue

## Objetivo

Desplegar una versión del backend en Render mediante el flujo de GitHub Actions y verificar que la API quede operativa. Este procedimiento es responsabilidad del equipo con acceso al repositorio, a Render y a los secretos del entorno.

## Prerrequisitos

- Cambio revisado y fusionado en la rama `main`.
- La compilación local o de CI finaliza correctamente con `npm run build`.
- Las variables del entorno objetivo están cargadas en Render: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, credenciales Google si se usa OAuth, credenciales Cloudinary si se cargan evidencias y `SWAGGER_ENABLED` según la política del ambiente.
- Existe un respaldo verificable de la base de datos previo a cualquier cambio de esquema.
- El responsable de la liberación conoce el [runbook de rollback](rollback.md).

## Procedimiento

1. Confirmar el commit que se va a liberar y el resultado correcto del workflow **Backend CI**. El workflow instala dependencias con `npm ci` y ejecuta `npm run build`.
2. Revisar en Render que el servicio tenga las variables de entorno del prerrequisito. No copiar valores secretos a GitHub Actions, logs ni tickets.
3. Integrar el cambio en `main`. Cuando **Backend CI** termina correctamente para `main`, el workflow **Deploy Backend** invoca el hook de despliegue de Render.
4. Esperar a que Render informe el despliegue como exitoso y revisar los logs de arranque. El proceso de producción debe ejecutar:

   ```powershell
   npm run start:prod
   ```

5. Ejecutar comprobaciones de humo contra la URL pública del servicio:

   ```powershell
   $baseUrl = 'https://<servicio-render>'
   Invoke-WebRequest "$baseUrl/api/v1/hierarchy/shallow" -UseBasicParsing
   ```

   Si Swagger está habilitado en ese ambiente, comprobar además `GET /api/v1/docs`. Para operaciones protegidas, usar un JWT de prueba autorizado y confirmar la respuesta esperada.
6. Registrar en el ticket de liberación: commit, fecha y hora, responsable, URL del despliegue, resultado de las comprobaciones y enlace al backup de base de datos.

## Criterios de éxito

- Render muestra el servicio en ejecución con la versión esperada.
- La consulta de humo devuelve una respuesta HTTP exitosa.
- No aparecen errores de conexión a PostgreSQL, JWT, Cloudinary u OAuth en los logs.
- El equipo cuenta con el identificador del despliegue previo para volver atrás si fuese necesario.

## Escalamiento

Si falla la compilación, el arranque o una comprobación de humo, detener la liberación y seguir el [runbook de rollback](rollback.md). Si el impacto alcanza usuarios o datos, abrir un incidente con el [runbook de incidentes](incidents.md).
