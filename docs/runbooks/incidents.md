# Runbook de respuesta a incidentes

## Objetivo

Coordinar una respuesta rápida, trazable y segura ante incidentes del backend, base de datos, autenticación, autorización, integración con Cloudinary o despliegue.

## Clasificación inicial

| Severidad | Ejemplos | Acción inicial |
| --- | --- | --- |
| SEV-1 | Exposición de datos o secretos, caída completa del servicio, pérdida o corrupción de datos. | Declarar incidente, limitar el impacto, convocar responsable técnico y de negocio. |
| SEV-2 | Función crítica degradada, fallas de autenticación generalizadas, despliegue fallido. | Abrir incidente, asignar responsable y preparar rollback. |
| SEV-3 | Error localizado, comportamiento incorrecto sin impacto general. | Registrar, priorizar corrección y monitorear. |

## Respuesta

1. **Detectar y registrar.** Anotar hora, quien detectó el problema, ambiente, URL o ruta afectada, usuarios impactados y síntomas observables.
2. **Asignar responsables.** Designar un responsable técnico para el diagnóstico y una persona para mantener informados a los interesados.
3. **Contener.** Si hay riesgo de seguridad o integridad, deshabilitar el acceso afectado mediante los controles disponibles y preservar logs. No publicar tokens, contraseñas ni URLs firmadas.
4. **Diagnosticar.** Revisar los logs de Render, el estado de PostgreSQL, variables de entorno y los errores de los consumidores. Mantener una línea temporal de decisiones y evidencia.
5. **Recuperar.** Para problemas originados por una liberación, seguir el [runbook de rollback](rollback.md). Para problemas de datos, conservar un backup antes de cualquier intervención.
6. **Verificar.** Ejecutar las comprobaciones de humo y los flujos de negocio afectados; confirmar tanto acceso autorizado como rechazo de acceso no autorizado cuando el incidente sea de seguridad.
7. **Comunicar el cierre.** Informar impacto, periodo, causa conocida, recuperación aplicada y tareas pendientes.

## Evidencia mínima

- Identificador del incidente y severidad.
- Línea temporal con responsables y decisiones.
- Commit y despliegue involucrados.
- Extractos de logs sin secretos ni datos personales innecesarios.
- Referencia a backups, restauraciones o rollbacks ejecutados.
- Resultado de las verificaciones posteriores.

## Post-incidente

En un plazo acordado por el equipo, documentar causa raíz, factores contribuyentes, acciones preventivas, responsable y fecha objetivo. Si el incidente afecta rutas protegidas, actualizar también la [matriz de permisos](../security/permissions-matrix.md).
