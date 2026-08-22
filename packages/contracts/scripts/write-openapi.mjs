import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Colibri OS API",
    description: "API del sistema Colibri OS - RaaS (Reputacion como Servicio)",
    version: "1.0.0"
  },
  servers: [
    { url: "http://localhost:3000/api/v1", description: "Development" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      UserRole: {
        type: "string",
        enum: ["entrepreneur", "mentor", "evaluator", "mecenas_semilla", "mecenas_fundacional", "mecenas_cambio", "admin", "guest"]
      },
      UserStatus: {
        type: "string",
        enum: ["active", "inactive", "suspended"]
      },
      ProjectStatus: {
        type: "string",
        enum: ["active", "inactive", "closed", "suspended"]
      },
      TrajectoryStatus: {
        type: "string",
        enum: ["on_track", "at_risk", "stalled", "completed"]
      },
      EvaluationType: {
        type: "string",
        enum: ["automatic", "human", "hybrid"]
      },
      EvaluationResult: {
        type: "string",
        enum: ["approved", "rejected", "needs_revision"]
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 1 }
        },
        additionalProperties: false
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "confirmPassword", "fullName"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 15 },
          confirmPassword: { type: "string" },
          fullName: { type: "string", minLength: 1 }
        },
        additionalProperties: false
      },
      AuthResponse: {
        type: "object",
        required: ["message", "token"],
        properties: {
          message: { type: "string" },
          token: { type: "string" }
        },
        additionalProperties: false
      },
      RegisterResponse: {
        type: "object",
        required: ["message", "token"],
        properties: {
          message: { type: "string" },
          token: { type: "string" }
        },
        additionalProperties: false
      },
      ErrorResponse: {
        type: "object",
        required: ["statusCode", "message"],
        properties: {
          statusCode: { type: "integer" },
          message: { type: "string" },
          error: { type: "string" }
        }
      },
      User: {
        type: "object",
        required: ["id", "email", "fullName", "role", "status", "provider", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          role: { $ref: "#/components/schemas/UserRole" },
          status: { $ref: "#/components/schemas/UserStatus" },
          provider: { type: "string", enum: ["local", "google"] },
          avatar: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        additionalProperties: false
      },
      Project: {
        type: "object",
        required: ["id", "ownerUserId", "projectName", "status", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          ownerUserId: { type: "string", format: "uuid" },
          projectName: { type: "string" },
          projectImageUrl: { type: "string", nullable: true },
          status: { $ref: "#/components/schemas/ProjectStatus" },
          country: { type: "string", nullable: true },
          industry: { type: "string", nullable: true },
          tagline: { type: "string", nullable: true },
          shortDescription: { type: "string", nullable: true },
          startupLinkedinUrl: { type: "string", format: "uri", nullable: true },
          websiteUrl: { type: "string", format: "uri", nullable: true },
          rlabProfileUrl: { type: "string", format: "uri", nullable: true },
          trajectoryStatus: { $ref: "#/components/schemas/TrajectoryStatus" },
          currentTramoId: { type: "string", format: "uuid", nullable: true },
          currentPacId: { type: "string", format: "uuid", nullable: true },
          nftImageUrl: { type: "string", nullable: true },
          lastActivityAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        additionalProperties: false
      },
      CreateProjectRequest: {
        type: "object",
        required: ["projectName"],
        properties: {
          projectName: { type: "string", minLength: 1 },
          status: { $ref: "#/components/schemas/ProjectStatus" },
          country: { type: "string" },
          industry: { type: "string" },
          tagline: { type: "string" },
          shortDescription: { type: "string" },
          startupLinkedinUrl: { type: "string", format: "uri" },
          websiteUrl: { type: "string", format: "uri" },
          rlabProfileUrl: { type: "string", format: "uri" },
          trajectoryStatus: { $ref: "#/components/schemas/TrajectoryStatus" }
        },
        additionalProperties: false
      },
      UpdateProjectRequest: {
        type: "object",
        properties: {
          projectName: { type: "string", minLength: 1 },
          status: { $ref: "#/components/schemas/ProjectStatus" },
          country: { type: "string" },
          industry: { type: "string" },
          tagline: { type: "string" },
          shortDescription: { type: "string" },
          startupLinkedinUrl: { type: "string", format: "uri" },
          websiteUrl: { type: "string", format: "uri" },
          rlabProfileUrl: { type: "string", format: "uri" },
          trajectoryStatus: { $ref: "#/components/schemas/TrajectoryStatus" }
        },
        additionalProperties: false
      },
      PaginatedProjects: {
        type: "object",
        required: ["data", "total", "page", "limit"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Project" } },
          total: { type: "integer" },
          page: { type: "integer" },
          limit: { type: "integer" }
        }
      }
    }
  },
  paths: {
    "/auth/login": {
      post: {
        operationId: "login",
        summary: "Iniciar sesion",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } }
        },
        responses: {
          "200": {
            description: "Login exitoso",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } }
          },
          "401": {
            description: "Credenciales invalidas",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          }
        }
      }
    },
    "/auth/register": {
      post: {
        operationId: "register",
        summary: "Registrar usuario",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } }
        },
        responses: {
          "201": {
            description: "Registro exitoso",
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterResponse" } } }
          },
          "400": {
            description: "Datos invalidos",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          }
        }
      }
    },
    "/projects": {
      get: {
        operationId: "listProjects",
        summary: "Listar proyectos",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
        ],
        responses: {
          "200": {
            description: "Lista de proyectos",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedProjects" } } }
          }
        }
      },
      post: {
        operationId: "createProject",
        summary: "Crear proyecto",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProjectRequest" } } }
        },
        responses: {
          "201": {
            description: "Proyecto creado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Project" } } }
          }
        }
      }
    },
    "/projects/{id}": {
      get: {
        operationId: "getProject",
        summary: "Obtener proyecto por ID",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": {
            description: "Proyecto encontrado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Project" } } }
          },
          "404": {
            description: "Proyecto no encontrado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } }
          }
        }
      },
      patch: {
        operationId: "updateProject",
        summary: "Actualizar proyecto",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProjectRequest" } } }
        },
        responses: {
          "200": {
            description: "Proyecto actualizado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Project" } } }
          }
        }
      },
      delete: {
        operationId: "deleteProject",
        summary: "Eliminar proyecto",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": {
            description: "Proyecto eliminado",
            content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" } } } } }
          }
        }
      }
    }
  }
};

const outPath = resolve(__dirname, '..', 'src', 'openapi.json');
writeFileSync(outPath, JSON.stringify(spec, null, 2));
console.log('OpenAPI spec escrito en ' + outPath);
