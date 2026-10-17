/**
 * QA-001: helpers de throttling conscientes del entorno.
 *
 * Los endpoints sensibles (signin/signup/demo-login/oauth/forgot/reset) tienen
 * limites bajos por IP pensados para produccion. La suite Playwright hace
 * decenas de logins desde la misma IP en un minuto, por lo que necesita relajar
 * esos limites.
 *
 * IMPORTANTE: el relajado es EXPLICITO via `E2E_RELAX_THROTTLE=true` y solo lo
 * activa el entorno E2E de Playwright (docker-compose.e2e.yml / CI e2e.yml).
 * Los tests Jest e2e (`NODE_ENV=test` sin esa variable) conservan el rate
 * limiting real, porque varias suites (OPS-003, QA-002) lo verifican.
 */
export function throttleLimit(productionLimit: number): number {
  return process.env.E2E_RELAX_THROTTLE === 'true' ? 1_000_000 : productionLimit;
}
