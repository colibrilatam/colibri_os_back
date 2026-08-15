# Proceso de excepciones de seguridad en CI

Aplica a hallazgos de SCA (npm audit, OSV-Scanner), SAST (CodeQL) y secret
scanning (Gitleaks) que bloquean un merge o un release.

## Cuándo se puede pedir una excepción

Solo quien vaya a mergear puede tomar una excepción, y solo si aplica alguno de estos casos:

- Falso positivo confirmado (el patrón detectado no es explotable en este contexto).
- Vulnerabilidad en una dependencia sin parche disponible todavía, con mitigación
  compensatoria documentada (ej. la ruta afectada no se usa, hay validación adicional, etc.).
- Secreto detectado que en realidad es un valor de prueba/dummy sin validez fuera de CI
  (igual debe rotarse si alguna vez fue real).

Una excepción **nunca** se usa para "ganar tiempo" en una vulnerabilidad crítica real y
explotable. Eso se corrige, no se excepciona.

## Cómo se pide

1. Abrir un issue con el label `security-exception` usando esta plantilla:
   - Hallazgo (ID de CVE / regla de CodeQL / regla de Gitleaks).
   - Justificación técnica de por qué no bloquea.
   - Mitigación compensatoria (si aplica).
   - Fecha de expiración propuesta (máximo 90 días).
   - Dueño responsable de revertir o resolver antes de esa fecha.
2. La excepción la aprueba una persona de SEC o de DEVX distinta de quien la pide.
3. Una vez aprobada, se aplica en el código de la herramienta correspondiente:
   - `npm audit` / `better-npm-audit`: agregar el ID a `--exclude` en el script
     `audit:prod` de `package.json`, referenciando el issue en un comentario.
   - CodeQL: usar una supresión en línea (`// lgtm[regla]` o `codeql[regla]`) con
     comentario que enlace al issue, nunca desactivar la regla globalmente.
   - Gitleaks: agregar la regla puntual a `.gitleaks.toml` (allowlist por commit/regex
     específico), nunca deshabilitar el escaneo.
4. Toda excepción queda registrada en `docs/security/exceptions-log.md` (tabla con
   fecha, hallazgo, dueño, expiración, issue).

## Revisión y expiración

- Las excepciones vencidas vuelven a bloquear automáticamente (no se renuevan solas).
- SEC revisa el log de excepciones activas una vez por sprint.
- Si una excepción vence sin resolución, el hallazgo vuelve a ser bloqueante y el
  responsable debe resolverlo o pedir una nueva excepción justificando la demora.