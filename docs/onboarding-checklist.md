# Checklist de onboarding y validación operativa (DOC-001)

Este checklist debe completarlo una persona **que no participó** en el
desarrollo del backend, para validar que la documentación alcanza por sí
sola. Cada sección corresponde a una prueba negativa del ticket DOC-001.

## 1. Onboarding: levantar el proyecto solo con el README

- [ ] Pude clonar el repo y ejecutar `npm ci` sin ayuda externa.
- [ ] Pude crear `.env` a partir de `.env.example` y levantar Postgres local.
- [ ] Pude ejecutar `npm run start:dev` y la app arrancó sin errores.
- [ ] Pude abrir `/api/v1/docs` (Swagger) y `/api/v1/health`.
- [ ] Entendí, sin preguntar a nadie, qué variables son obligatorias
      (ver [`docs/configuration.md`](configuration.md)).

**Tiempo total:** _____ minutos. **Bloqueos encontrados:** _____________

## 2. Despliegue siguiendo solo el runbook

- [ ] Seguí únicamente [`docs/runbooks/deployment.md`](runbooks/deployment.md), sin ayuda externa.
- [ ] Verifiqué las variables de entorno cargadas en Render antes de liberar.
- [ ] El despliegue quedó exitoso en Render.
- [ ] Las comprobaciones de humo (`/api/v1/hierarchy/shallow`, `/api/v1/health`, `/api/v1/ready`) respondieron según lo esperado.

**Evidencia adjunta:** enlace al log de despliegue / captura de Render: _____________

## 3. Rollback siguiendo solo la documentación

- [ ] Seguí únicamente [`docs/runbooks/rollback.md`](runbooks/rollback.md), sin ayuda externa.
- [ ] Pude identificar el último despliegue exitoso y volver a él en Render.
- [ ] Si aplicaba, ejecuté `npm run migration:revert` según el procedimiento documentado.
- [ ] Las comprobaciones de humo posteriores al rollback pasaron.

**Evidencia adjunta:** enlace al log de rollback / captura de Render: _____________

## Firma de validación

| Rol | Nombre | Fecha | Resultado (aprueba / observaciones) |
| --- | --- | --- | --- |
| Persona validadora (no participante) | | | |
| Responsable BE/DEVX | | | |