# Log de excepciones de seguridad

Registro histórico de excepciones aprobadas al proceso descrito en
[`exceptions-process.md`](exceptions-process.md). Toda excepción activa
o vencida debe figurar acá; no se documentan excepciones fuera de esta
tabla.

| Fecha | Hallazgo (CVE / regla) | Justificación | Mitigación compensatoria | Dueño | Expiración | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| _(sin excepciones registradas al momento de este cambio)_ | | | | | | |

## Cómo agregar una fila

1. Completar la fila solo después de que la excepción fue aprobada según
   `exceptions-process.md`.
2. La fecha de expiración no puede superar los 90 días desde la aprobación.
3. Al resolver o revertir el hallazgo, mover la fila a la sección
   "Cerradas" (crear la sección si es la primera vez) en lugar de borrarla.