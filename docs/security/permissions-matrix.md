# Matriz de permisos

## Cómo leerla

Todas las rutas usan el prefijo `/api/v1`. Esta matriz refleja los guards y decoradores presentes en los controladores; no infiere permisos por propiedad de un recurso ni reglas internas de los servicios. Después de cada cambio de seguridad debe verificarse en Swagger y con pruebas de integración.

| Rol | Valor en API | Uso funcional |
| --- | --- | --- |
| Emprendedor | `entrepreneur` | Ejecuta el recorrido y presenta evidencia. |
| Mentor | `mentor` | Acompaña y puede participar en revisiones autorizadas. |
| Evaluador | `evaluator` | Revisa evidencia y opera reglas de evaluación autorizadas. |
| Mecenas semilla | `mecenas_semilla` | Consulta información reputacional autorizada. |
| Mecenas fundacional | `mecenas_fundacional` | Consulta información reputacional autorizada. |
| Mecenas de cambio | `mecenas_cambio` | Consulta información reputacional autorizada. |
| Administrador | `admin` | Administra reglas, rúbricas, versiones y operaciones privilegiadas. |
| Invitado | `guest` | Rol definido en el modelo; no cuenta con permisos específicos declarados. |

## Acceso por recurso

| Recurso y operaciones | Protección efectiva declarada | Roles autorizados |
| --- | --- | --- |
| `auth`: `POST /signin`, `POST /signup`; `GET /google` y `/google/callback` | Público; el flujo Google usa su guard Passport específico. | No aplica. |
| `categories`, `hierarchy`, `mecenas-semilla`, `micro-action-definitions`, `nft-projects`, `pacs`, `projects/:projectId/members`, `projects/:projectId/profile`, `tramo-closure` | Sin `JwtAuthGuard` declarado en el controlador. | Público. |
| `tramos`, incl. `DELETE /tramos/:id` | Sin `JwtAuthGuard` ni `RolesGuard` declarados. El decorador `@Roles(ADMIN)` del borrado no se evalúa sin `RolesGuard`. | Público. |
| Lectura de proyectos: `GET /projects`, `GET /projects/:id` | Sin guard declarado. | Público. |
| Escritura de proyectos: alta, edición, borrado y relación con PAC | `JwtAuthGuard` por operación. | Cualquier usuario con JWT válido. |
| `analytics`, `curriculum`, `evidence`, `execution`, `learning-resources`, `mecenas-nft-portfolio`, `nft-actor`, `nft-ownership-events`, `users` | `JwtAuthGuard` a nivel de controlador. | Cualquier usuario con JWT válido. |
| `micro-action-instances`: crear, ver propios, ver detalle, editar, enviar, reabrir y borrar | `JwtAuthGuard` + `RolesGuard`. | Emprendedor y administrador; el detalle también permite mentor y evaluador. |
| `micro-action-instances/project/:projectId` | `JwtAuthGuard` + `RolesGuard`, pero sin roles declarados para la operación. | Cualquier usuario con JWT válido. |
| `digital-credentials`: consultas | `JwtAuthGuard` + `RolesGuard`. | Emprendedor, mentor, evaluador y administrador. |
| `digital-credentials/:id/revoke` | `JwtAuthGuard` + `RolesGuard`. | Administrador. |
| `evaluations`: crear, finalizar, crear rúbrica y listar rúbricas activas | `JwtAuthGuard` + `RolesGuard`, sin roles declarados en esas operaciones. | Cualquier usuario con JWT válido. |
| `evaluations/ai-result` | `JwtAuthGuard` + `RolesGuard`. | Administrador. |
| `evaluations/human-review`, `pending-reviews`, consulta de rúbrica individual | `JwtAuthGuard` + `RolesGuard`. | Mentor, evaluador y administrador. |
| Consultas de evaluación y evidencia asociada | `JwtAuthGuard` + `RolesGuard`. | Emprendedor, mentor, evaluador y administrador. |
| Actualización de rúbrica | `JwtAuthGuard` + `RolesGuard`. | Administrador. |
| `reputation/algorithm-versions` (crear, listar y detalle) | `JwtAuthGuard` + `RolesGuard`. | Administrador. |
| Versión activa del algoritmo | `JwtAuthGuard` + `RolesGuard`. | Administrador, evaluador y mentor. |
| `reputation/calculate` | `JwtAuthGuard` + `RolesGuard`, sin roles declarados. | Cualquier usuario con JWT válido. |
| Snapshots y su historial reputacional | `JwtAuthGuard` + `RolesGuard`. | Emprendedor, mentor, evaluador, administrador y los tres roles de mecenas. |

## Reglas de mantenimiento

1. Una ruta que requiera sesión debe usar `JwtAuthGuard`.
2. Una ruta restringida por rol debe usar juntos `JwtAuthGuard` y `RolesGuard`, además de `@Roles(...)`.
3. Todo endpoint nuevo debe incorporarse a esta matriz en el mismo pull request.
4. Antes de liberar, probar un caso permitido y un caso denegado para cada operación privilegiada.

Los procedimientos de despliegue y respuesta operativa están en los [runbooks](../runbooks/deployment.md).
