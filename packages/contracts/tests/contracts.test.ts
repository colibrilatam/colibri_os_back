import { describe, it, expect } from 'vitest';
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  AuthResponseSchema,
  ProjectSchema,
  CreateProjectRequestSchema,
  ErrorResponseSchema,
  UserSchema,
} from '../src/generated';
import {
  mockUser,
  mockProject,
  mockAuthResponse,
  mockErrorResponse,
} from '../src/mocks';

describe('Auth Contracts', () => {
  describe('LoginRequest', () => {
    it('accepts valid login request', () => {
      const result = LoginRequestSchema.safeParse({
        email: 'test@mail.com',
        password: 'MiPass123!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = LoginRequestSchema.safeParse({
        email: 'not-an-email',
        password: 'MiPass123!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = LoginRequestSchema.safeParse({
        email: 'test@mail.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects extra fields (strict mode)', () => {
      const result = LoginRequestSchema.safeParse({
        email: 'test@mail.com',
        password: 'MiPass123!',
        extraField: 'should not be here',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterRequest', () => {
    it('accepts valid registration', () => {
      const result = RegisterRequestSchema.safeParse({
        email: 'test@mail.com',
        password: 'MiPass123!',
        confirmPassword: 'MiPass123!',
        fullName: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('rejects password shorter than 8 chars', () => {
      const result = RegisterRequestSchema.safeParse({
        email: 'test@mail.com',
        password: 'Short1!',
        confirmPassword: 'Short1!',
        fullName: 'Test User',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = RegisterRequestSchema.safeParse({
        email: 'test@mail.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AuthResponse', () => {
    it('accepts valid auth response', () => {
      const result = AuthResponseSchema.safeParse({
        message: 'Usuario logueado con exito',
        token: 'eyJhbGciOiJIUzI1NiJ9.test',
      });
      expect(result.success).toBe(true);
    });

    it('rejects response with capital M (backend bug)', () => {
      const result = AuthResponseSchema.safeParse({
        Message: 'Usuario logueado con exito',
        token: 'eyJhbGciOiJIUzI1NiJ9.test',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing token', () => {
      const result = AuthResponseSchema.safeParse({
        message: 'Login exitoso',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Project Contracts', () => {
  describe('Project', () => {
    it('accepts valid project from mock', () => {
      const project = mockProject();
      const result = ProjectSchema.safeParse(project);
      expect(result.success).toBe(true);
    });

    it('accepts project with all optional fields', () => {
      const project = mockProject({
        country: 'Argentina',
        industry: 'Tech',
        tagline: 'Best startup',
        shortDescription: 'A great project',
        startupLinkedinUrl: 'https://linkedin.com/company/test',
        websiteUrl: 'https://test.com',
        rlabProfileUrl: 'https://rlab.com/test',
        trajectoryStatus: 'on_track',
      });
      const result = ProjectSchema.safeParse(project);
      expect(result.success).toBe(true);
    });

    it('rejects project with invalid UUID', () => {
      const result = ProjectSchema.safeParse({
        id: 'not-a-uuid',
        ownerUserId: 'also-not-uuid',
        projectName: 'Test',
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });

    it('rejects project with invalid status enum', () => {
      const result = ProjectSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        ownerUserId: '550e8400-e29b-41d4-a716-446655440001',
        projectName: 'Test',
        status: 'INVALID_STATUS',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });

    it('rejects project with invalid URL format', () => {
      const result = ProjectSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        ownerUserId: '550e8400-e29b-41d4-a716-446655440001',
        projectName: 'Test',
        status: 'active',
        websiteUrl: 'not-a-url',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProjectRequest', () => {
    it('accepts minimal valid request', () => {
      const result = CreateProjectRequestSchema.safeParse({
        projectName: 'Mi Startup',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty projectName', () => {
      const result = CreateProjectRequestSchema.safeParse({
        projectName: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects extra fields', () => {
      const result = CreateProjectRequestSchema.safeParse({
        projectName: 'Mi Startup',
        id: 'should-not-be-here',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('User Contract', () => {
  it('accepts valid user from mock', () => {
    const user = mockUser();
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(true);
  });

  it('rejects user with invalid role', () => {
    const result = UserSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@mail.com',
      fullName: 'Test',
      role: 'INVALID_ROLE',
      status: 'active',
      provider: 'local',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('Error Contract', () => {
  it('accepts valid error response', () => {
    const error = mockErrorResponse();
    const result = ErrorResponseSchema.safeParse(error);
    expect(result.success).toBe(true);
  });

  it('rejects error without statusCode', () => {
    const result = ErrorResponseSchema.safeParse({
      message: 'Error',
    });
    expect(result.success).toBe(false);
  });
});

describe('Negative Tests - Contract Divergence', () => {
  it('backend removes required field -> frontend detects', () => {
    const backendResponse = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      ownerUserId: '550e8400-e29b-41d4-a716-446655440001',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const result = ProjectSchema.safeParse(backendResponse);
    expect(result.success).toBe(false);
  });

  it('backend sends unsupported enum -> frontend rejects', () => {
    const backendResponse = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      ownerUserId: '550e8400-e29b-41d4-a716-446655440001',
      projectName: 'Test',
      status: 'DEPRECATED_STATUS',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const result = ProjectSchema.safeParse(backendResponse);
    expect(result.success).toBe(false);
  });

  it('incompatible contract version -> frontend detects structural mismatch', () => {
    const v1Response = {
      message: 'Exito',
      token: 'abc123',
    };
    const v2Response = {
      success: true,
      accessToken: 'abc123',
      refreshToken: 'def456',
    };
    expect(AuthResponseSchema.safeParse(v1Response).success).toBe(true);
    expect(AuthResponseSchema.safeParse(v2Response).success).toBe(false);
  });
});