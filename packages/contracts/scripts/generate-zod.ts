import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const specPath = resolve(rootDir, 'src', 'openapi.json');
const outPath = resolve(rootDir, 'src', 'generated', 'schemas.ts');

if (!existsSync(specPath)) {
  console.error(`No se encontro ${specPath}. Ejecutar contract:export primero.`);
  process.exit(1);
}

type JsonSchema = {
  type?: string;
  format?: string;
  enum?: (string | number)[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  nullable?: boolean;
  $ref?: string;
  minLength?: number;
  maxLength?: number;
};

type OpenApiSpec = {
  components: { schemas: Record<string, JsonSchema> };
};

const spec = JSON.parse(readFileSync(specPath, 'utf-8')) as OpenApiSpec;
const schemas = spec.components.schemas;

// DTO de NestJS -> nombre del schema exportado.
const RENAME: Record<string, string> = {
  LoginDto: 'LoginRequest',
  AuthResponseDto: 'AuthResponse',
  CreateUserDto: 'RegisterRequest',
  RegisterResponseDto: 'RegisterResponse',
  UserResponseDto: 'User',
  ProjectResponseDto: 'Project',
  CreateProjectDto: 'CreateProjectRequest',
  UpdateProjectDto: 'UpdateProjectRequest',
  CompleteProfileResponseDto: 'CompleteProfileResponse',
  MessageResponseDto: 'MessageResponse',
  GoogleExchangeDto: 'GoogleExchangeRequest',
  GoogleExchangeResponseDto: 'GoogleExchangeResponse',
};

// Enums que exportamos con nombre propio. Los mas especificos primero
// para que el matcher no confunda uno con otro.
const ENUMS: { name: string; values: string[] }[] = [
  {
    name: 'UserRole',
    values: [
      'entrepreneur',
      'mentor',
      'evaluator',
      'mecenas_semilla',
      'mecenas_fundacional',
      'mecenas_cambio',
      'admin',
      'guest',
      'demo_readonly', // SEC-002
    ],
  },
  { name: 'UserStatus', values: ['active', 'inactive', 'suspended', 'pending_profile'] },
  { name: 'AuthProvider', values: ['local', 'google'] },
  { name: 'ProjectStatus', values: ['active', 'inactive', 'closed', 'suspended'] },
  { name: 'TrajectoryStatus', values: ['on_track', 'at_risk', 'stalled', 'completed'] },
];

// Overrides puntuales donde NestJS no propaga la validacion al OpenAPI.
// Borrar estas entradas cuando se agregue el decorador correspondiente
// en el DTO del backend.
const FIELD_OVERRIDES: Record<string, Record<string, string>> = {
  LoginDto: {
    password: 'z.string().min(1)',
  },
  CreateUserDto: {
    password: 'z.string().min(8).max(15)',
  },
};

// Mapeo de format OpenAPI -> helper Zod 4.
const STRING_FORMAT: Record<string, string> = {
  email: 'z.email()',
  uuid: 'z.uuid()',
  'date-time': 'z.iso.datetime()',
  uri: 'z.url()',
  url: 'z.url()',
  binary: 'z.any()',
};

function findEnumName(values: (string | number)[]): string | null {
  for (const e of ENUMS) {
    if (
      e.values.length === values.length &&
      e.values.every((v) => (values as (string | number)[]).includes(v))
    ) {
      return e.name;
    }
  }
  return null;
}

function zodType(schema: JsonSchema): string {
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()!;
    const renamed = RENAME[refName];
    if (!renamed) throw new Error(`$ref fuera de scope: ${refName}`);
    return `${renamed}Schema`;
  }
  if (schema.enum) {
    const enumName = findEnumName(schema.enum);
    if (enumName) return `${enumName}Schema`;
    return `z.enum([${schema.enum.map((v) => JSON.stringify(v)).join(', ')}])`;
  }
  if (schema.type === 'array' && schema.items) {
    return `z.array(${zodType(schema.items)})`;
  }
  if (schema.type === 'string') {
    if (schema.format && STRING_FORMAT[schema.format]) {
      return STRING_FORMAT[schema.format];
    }
    let base = 'z.string()';
    if (schema.minLength && schema.minLength > 0) base += `.min(${schema.minLength})`;
    if (schema.maxLength && schema.maxLength > 0) base += `.max(${schema.maxLength})`;
    return base;
  }
  if (schema.type === 'integer' || schema.type === 'number') return 'z.number()';
  if (schema.type === 'boolean') return 'z.boolean()';
  return 'z.unknown()';
}

function generateDto(dtoName: string): string {
  const schema = schemas[dtoName];
  if (!schema) throw new Error(`DTO no encontrado en OpenAPI: ${dtoName}`);
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const overrides = FIELD_OVERRIDES[dtoName] ?? {};
  const lines: string[] = [];

  for (const [field, propSchema] of Object.entries(props)) {
    let t = overrides[field] ?? zodType(propSchema);
    if (propSchema.nullable) t += '.nullable()';
    if (!required.has(field)) t += '.optional()';
    lines.push(`  ${field}: ${t},`);
  }

  return `export const ${RENAME[dtoName]}Schema = z.strictObject({\n${lines.join('\n')}\n});`;
}

const out: string[] = [
  '// AUTO-GENERADO por scripts/generate-zod.ts — NO EDITAR A MANO.',
  '// Fuente: src/openapi.json (generado por NestJS).',
  "// Para regenerar: npm run contract:generate desde la raiz del backend.",
  '',
  "import { z } from 'zod';",
  '',
];

for (const e of ENUMS) {
  out.push(
    `export const ${e.name}Schema = z.enum([${e.values.map((v) => `'${v}'`).join(', ')}]);`,
  );
}
out.push('');

// El orden importa: los DTOs que referencian enums van despues de los enums,
// y los que referencian otros DTOs van despues de esos DTOs.
const ORDER = [
  'LoginDto',
  'UserResponseDto',
  'AuthResponseDto',
  'CreateUserDto',
  'RegisterResponseDto',
  'ProjectResponseDto',
  'CreateProjectDto',
  'UpdateProjectDto',
  'CompleteProfileResponseDto',
  'GoogleExchangeDto',
  'GoogleExchangeResponseDto',
  'MessageResponseDto',
];

for (const dtoName of ORDER) {
  out.push(generateDto(dtoName));
  out.push('');
}

const TYPES: [string, string][] = [
  ['UserRole', 'UserRoleSchema'],
  ['UserStatus', 'UserStatusSchema'],
  ['AuthProvider', 'AuthProviderSchema'],
  ['ProjectStatus', 'ProjectStatusSchema'],
  ['TrajectoryStatus', 'TrajectoryStatusSchema'],
  ['LoginRequest', 'LoginRequestSchema'],
  ['AuthResponse', 'AuthResponseSchema'],
  ['RegisterRequest', 'RegisterRequestSchema'],
  ['RegisterResponse', 'RegisterResponseSchema'],
  ['User', 'UserSchema'],
  ['Project', 'ProjectSchema'],
  ['CreateProjectRequest', 'CreateProjectRequestSchema'],
  ['UpdateProjectRequest', 'UpdateProjectRequestSchema'],
  ['CompleteProfileResponse', 'CompleteProfileResponseSchema'],
  ['GoogleExchangeRequest', 'GoogleExchangeRequestSchema'],
  ['GoogleExchangeResponse', 'GoogleExchangeResponseSchema'],
  ['MessageResponse', 'MessageResponseSchema'],
];

for (const [typeName, schemaName] of TYPES) {
  out.push(`export type ${typeName} = z.infer<typeof ${schemaName}>;`);
}
out.push('');

writeFileSync(outPath, out.join('\n'));
console.log(`Generado ${outPath}`);