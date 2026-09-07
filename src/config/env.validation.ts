// src/config/env.validation.ts
//
// OPS-004: esquema de configuración obligatorio. Si el entorno no cumple
// este esquema, la aplicación NO debe arrancar (fail-safe).
//
// IMPORTANTE: los mensajes de error solo incluyen el NOMBRE de la variable
// y el motivo. Nunca se loguea el valor recibido (evita filtrar secretos
// en logs de arranque).

import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsBooleanString,
  Matches,
  Min,
  Max,
  MinLength,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  validateSync,
  ValidationError,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Staging = 'staging',
  Production = 'production',
}

const MS_DURATION_REGEX = /^\d+(\.\d+)?(ms|s|m|h|d|w|y)$/i;
const BODY_SIZE_REGEX = /^\d+(b|kb|mb|gb)$/i;

/** Convierte '' / undefined a undefined para que @IsOptional funcione bien con env vars vacías. */
function emptyToUndefined({ value }: { value: unknown }): unknown {
  return value === '' || value === undefined ? undefined : value;
}

function toNumber({ value }: { value: unknown }): unknown {
  if (value === '' || value === undefined) return undefined;
  return Number(value);
}

/** TLS obligatorio en producción: no puede quedar deshabilitado explícitamente. */
@ValidatorConstraint({ name: 'tlsRequiredInProduction', async: false })
class TlsRequiredInProductionConstraint implements ValidatorConstraintInterface {
  validate(value: string | undefined, args: ValidationArguments): boolean {
    const obj = args.object as EnvironmentVariables;
    if (obj.NODE_ENV !== NodeEnv.Production) return true;
    // Si está seteado, no puede ser 'false'/'0' en producción.
    return value === undefined || (value !== 'false' && value !== '0');
  }
  defaultMessage(): string {
    return 'DATABASE_SSL no puede estar deshabilitado en producción: la conexión a la base de datos debe usar TLS';
  }
}

/** Evita truncar/borrar datos de producción por accidente vía el script de seed. */
@ValidatorConstraint({ name: 'noDestructiveSeedInProduction', async: false })
class NoDestructiveSeedInProductionConstraint implements ValidatorConstraintInterface {
  validate(value: string | undefined, args: ValidationArguments): boolean {
    const obj = args.object as EnvironmentVariables;
    if (obj.NODE_ENV !== NodeEnv.Production) return true;
    return value === undefined || value === '' || value.toLowerCase() !== 'true';
  }
  defaultMessage(): string {
    return 'CONFIRM_DESTRUCTIVE_SEED no debe estar definida como "true" en producción';
  }
}

/** Lista de orígenes/URLs separados por coma, cada uno válido. */
@ValidatorConstraint({ name: 'isCommaSeparatedUrlList', async: false })
class IsCommaSeparatedUrlListConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value !== 'string') return false;
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .every((url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
  }
  defaultMessage(): string {
    return 'debe ser una lista de URLs válidas separadas por comas (ej: https://app.com,https://preview.app.com)';
  }
}

export class EnvironmentVariables {
  // ---------- APP ----------
  @IsEnum(NodeEnv, { message: 'NODE_ENV debe ser development | test | staging | production' })
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Transform(toNumber)
  @IsInt({ message: 'PORT debe ser un entero' })
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  // ---------- BASE DE DATOS ----------
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL es obligatoria' })
  @Matches(/^postgres(ql)?:\/\/.+/i, {
    message: 'DATABASE_URL debe ser una URL postgres:// o postgresql:// válida',
  })
  DATABASE_URL: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsBooleanString({ message: 'DATABASE_SSL debe ser "true" o "false"' })
  @Validate(TlsRequiredInProductionConstraint)
  DATABASE_SSL?: string;

  // ---------- JWT ----------
  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET es obligatorio: la aplicación no puede firmar sesiones sin un secreto' })
  @MinLength(32, { message: 'JWT_SECRET debe tener al menos 32 caracteres' })
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty({ message: 'JWT_EXPIRES_IN es obligatorio' })
  @Matches(MS_DURATION_REGEX, {
    message: 'JWT_EXPIRES_IN debe tener formato de duración (ej: 15m, 1h, 7d)',
  })
  JWT_EXPIRES_IN: string;

  // ---------- GOOGLE OAUTH ----------
  @IsString()
  @IsNotEmpty({ message: 'GOOGLE_CLIENT_ID es obligatorio (GoogleStrategy se registra siempre)' })
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty({ message: 'GOOGLE_CLIENT_SECRET es obligatorio' })
  GOOGLE_CLIENT_SECRET: string;

  @IsUrl({ require_tld: false }, { message: 'GOOGLE_CALLBACK_URL debe ser una URL válida' })
  GOOGLE_CALLBACK_URL: string;

  // ---------- CLOUDINARY ----------
  @IsString()
  @IsNotEmpty({ message: 'CLOUDINARY_CLOUD_NAME es obligatorio' })
  CLOUDINARY_CLOUD_NAME: string;

  @IsString()
  @IsNotEmpty({ message: 'CLOUDINARY_API_KEY es obligatorio' })
  CLOUDINARY_API_KEY: string;

  @IsString()
  @IsNotEmpty({ message: 'CLOUDINARY_API_SECRET es obligatorio' })
  CLOUDINARY_API_SECRET: string;

  // ---------- FRONTEND / CORS ----------
  @IsUrl({ require_tld: false }, { message: 'FRONTEND_URL debe ser una URL válida' })
  FRONTEND_URL: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @Validate(IsCommaSeparatedUrlListConstraint)
  FRONTEND_URLS?: string;

  // ---------- SWAGGER / MANTENIMIENTO ----------
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsBooleanString({ message: 'SWAGGER_ENABLED debe ser "true" o "false"' })
  SWAGGER_ENABLED?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsBooleanString({ message: 'MAINTENANCE_MODE debe ser "true" o "false"' })
  MAINTENANCE_MODE?: string;

  @IsOptional()
  @IsString()
  MAINTENANCE_ALLOWED_PATHS?: string;

  // ---------- SEED (destructivo) ----------
  @IsOptional()
  @IsString()
  SEED_USERS_PASSWORD?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsBooleanString({ message: 'CONFIRM_DESTRUCTIVE_SEED debe ser "true" o "false"' })
  @Validate(NoDestructiveSeedInProductionConstraint)
  CONFIRM_DESTRUCTIVE_SEED?: string;

  // ---------- LÍMITES / TIMEOUTS (expiraciones) ----------
  @IsOptional()
  @Matches(BODY_SIZE_REGEX, { message: 'MAX_JSON_BODY_SIZE debe tener formato de tamaño (ej: 1mb, 512kb)' })
  MAX_JSON_BODY_SIZE: string = '1mb';

  @Transform(toNumber)
  @IsOptional()
  @IsInt({ message: 'MAX_PROJECT_IMAGE_BYTES debe ser un entero (bytes)' })
  @Min(1, { message: 'MAX_PROJECT_IMAGE_BYTES debe ser mayor a 0' })
  MAX_PROJECT_IMAGE_BYTES: number = 5_242_880;

  @Transform(toNumber)
  @IsOptional()
  @IsInt({ message: 'REQUEST_TIMEOUT_MS debe ser un entero (ms)' })
  @Min(1, { message: 'REQUEST_TIMEOUT_MS debe ser mayor a 0' })
  REQUEST_TIMEOUT_MS: number = 15_000;

  @Transform(toNumber)
  @IsOptional()
  @IsInt({ message: 'SOCKET_TIMEOUT_MS debe ser un entero (ms)' })
  @Min(1, { message: 'SOCKET_TIMEOUT_MS debe ser mayor a 0' })
  SOCKET_TIMEOUT_MS: number = 30_000;

  @Transform(toNumber)
  @IsOptional()
  @IsInt({ message: 'OAUTH_STATE_COOKIE_MAX_AGE_MS debe ser un entero (ms)' })
  @Min(1, { message: 'OAUTH_STATE_COOKIE_MAX_AGE_MS debe ser mayor a 0' })
  OAUTH_STATE_COOKIE_MAX_AGE_MS: number = 300_000;

  @Transform(toNumber)
  @IsOptional()
  @IsInt({ message: 'OAUTH_EXCHANGE_CODE_TTL_MS debe ser un entero (ms)' })
  @Min(1, { message: 'OAUTH_EXCHANGE_CODE_TTL_MS debe ser mayor a 0' })
  OAUTH_EXCHANGE_CODE_TTL_MS: number = 60_000;
}

/** Junta los mensajes de un árbol de ValidationError sin exponer los valores recibidos. */
function flattenValidationErrors(errors: ValidationError[], prefix = ''): string[] {
  return errors.flatMap((error) => {
    const path = prefix ? `${prefix}.${error.property}` : error.property;
    const ownMessages = error.constraints ? Object.values(error.constraints).map((m) => `- ${path}: ${m}`) : [];
    const childMessages = error.children?.length ? flattenValidationErrors(error.children, path) : [];
    return [...ownMessages, ...childMessages];
  });
}

/**
 * Función a pasar como `validate` en ConfigModule.forRoot.
 * Lanza un Error (sin secretos) y aborta el arranque si el entorno es inválido.
 */
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const details = flattenValidationErrors(errors);
    throw new Error(
      `Configuración de entorno inválida. Corrija las siguientes variables antes de arrancar:\n${details.join('\n')}`,
    );
  }

  return validatedConfig;
}