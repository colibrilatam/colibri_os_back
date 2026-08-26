import { validateEnv } from './env.validation';

function baseValidConfig(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    NODE_ENV: 'development',
    PORT: '3000',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    JWT_SECRET: 'a'.repeat(32),
    JWT_EXPIRES_IN: '7d',
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
    CLOUDINARY_CLOUD_NAME: 'cloud',
    CLOUDINARY_API_KEY: 'key',
    CLOUDINARY_API_SECRET: 'secret',
    FRONTEND_URL: 'http://localhost:3000',
    ...overrides,
  };
}

describe('validateEnv (OPS-004)', () => {
  it('acepta una configuración válida', () => {
    expect(() => validateEnv(baseValidConfig())).not.toThrow();
  });

  it('falla si falta JWT_SECRET', () => {
    const config = baseValidConfig();
    delete (config as Record<string, unknown>).JWT_SECRET;
    expect(() => validateEnv(config)).toThrow(/JWT_SECRET/);
  });

  it('no incluye el valor del secreto en el mensaje de error', () => {
    const secretValue = 'muy-corto'; // menor a 32 chars -> inválido
    try {
      validateEnv(baseValidConfig({ JWT_SECRET: secretValue }));
      fail('debía lanzar');
    } catch (error) {
      expect((error as Error).message).not.toContain(secretValue);
      expect((error as Error).message).toContain('JWT_SECRET');
    }
  });

  it('falla si DATABASE_URL es inválida', () => {
    expect(() =>
      validateEnv(baseValidConfig({ DATABASE_URL: 'no-es-una-url' })),
    ).toThrow(/DATABASE_URL/);
  });

  it('falla si TLS está deshabilitado explícitamente en producción', () => {
    expect(() =>
      validateEnv(
        baseValidConfig({
          NODE_ENV: 'production',
          DATABASE_SSL: 'false',
        }),
      ),
    ).toThrow(/DATABASE_SSL/);
  });

  it('permite TLS deshabilitado fuera de producción', () => {
    expect(() =>
      validateEnv(baseValidConfig({ NODE_ENV: 'development', DATABASE_SSL: 'false' })),
    ).not.toThrow();
  });

  it('falla con JWT_EXPIRES_IN con formato inválido', () => {
    expect(() => validateEnv(baseValidConfig({ JWT_EXPIRES_IN: 'siete-dias' }))).toThrow(
      /JWT_EXPIRES_IN/,
    );
  });

  it('falla con timeouts/expiraciones no numéricas o negativas', () => {
    expect(() =>
      validateEnv(baseValidConfig({ REQUEST_TIMEOUT_MS: '-100' })),
    ).toThrow(/REQUEST_TIMEOUT_MS/);
    expect(() =>
      validateEnv(baseValidConfig({ OAUTH_EXCHANGE_CODE_TTL_MS: 'no-numero' })),
    ).toThrow(/OAUTH_EXCHANGE_CODE_TTL_MS/);
  });

  it('falla si CONFIRM_DESTRUCTIVE_SEED=true en producción', () => {
    expect(() =>
      validateEnv(
        baseValidConfig({ NODE_ENV: 'production', CONFIRM_DESTRUCTIVE_SEED: 'true' }),
      ),
    ).toThrow(/CONFIRM_DESTRUCTIVE_SEED/);
  });

  it('falla con FRONTEND_URLS mal formado', () => {
    expect(() =>
      validateEnv(baseValidConfig({ FRONTEND_URLS: 'https://ok.com,no-es-url' })),
    ).toThrow(/FRONTEND_URLS/);
  });
});