/**
 * QA-001: helpers de throttling conscientes del entorno.
 *
 * Los endpoints sensibles (signin/signup/demo-login/oauth/forgot/reset) tienen
 * limites bajos por IP pensados para produccion. En el entorno de tests
 * (`NODE_ENV=test`) esos limites rompen suites que hacen muchos logins desde
 * la misma IP (Playwright, Jest e2e), devolviendo 429 de forma intermitente.
 *
 * `throttleLimit` relaja el limite SOLO en test. En development/production
 * conserva el valor real, para no debilitar el rate limiting fuera de tests.
 */
export function throttleLimit(productionLimit: number): number {
  return process.env.NODE_ENV === 'test' ? 1_000_000 : productionLimit;
}
