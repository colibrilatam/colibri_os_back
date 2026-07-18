# Runbook de rollback

## Objetivo

Restaurar el backend a una versión estable ante un despliegue fallido, degradación de servicio o comportamiento no esperado. Priorice la recuperación del servicio y la preservación de datos.

## Antes de iniciar

- Designar a una persona responsable de la recuperación.
- Identificar el último despliegue exitoso y su commit asociado.
- Abrir o actualizar el incidente si el problema afecta usuarios, integridad de datos o seguridad.
- Conservar logs y el identificador del despliegue fallido antes de realizar acciones.

## Rollback de aplicación en Render

1. En Render, localizar el último despliegue exitoso del servicio backend.
2. Seleccionar **Redeploy** sobre esa versión o desplegar el commit estable desde `main`, según el mecanismo habilitado en el servicio.
3. Esperar a que el estado del servicio sea exitoso y revisar los logs de arranque.
4. Ejecutar la comprobación de humo:

   ```powershell
   $baseUrl = 'https://<servicio-render>'
   Invoke-WebRequest "$baseUrl/api/v1/hierarchy/shallow" -UseBasicParsing
   ```

5. Probar una operación autenticada representativa con un usuario de prueba y confirmar que el comportamiento vuelve a ser el esperado.

## Recuperación de datos y esquema

1. No ejecutar acciones destructivas sobre PostgreSQL hasta identificar la versión de datos requerida.
2. Restaurar el respaldo más reciente aprobado mediante el procedimiento de la plataforma de base de datos.
3. Cuando corresponda revertir la última migración aplicada, ejecutar desde una copia del código compatible y con las variables del ambiente objetivo:

   ```powershell
   npm run migration:revert
   ```

4. Verificar las consultas de humo y las operaciones de negocio afectadas después de recuperar la base.

## Cierre

Documentar el commit restaurado, la hora de inicio y finalización, las acciones sobre datos, las pruebas realizadas y los efectos pendientes. Abrir tareas correctivas antes de reintentar la liberación.

Para coordinación y comunicación, usar el [runbook de incidentes](incidents.md).
