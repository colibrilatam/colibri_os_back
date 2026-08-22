import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'entrepreneur', 'mentor', 'evaluator', 'mecenas_semilla',
  'mecenas_fundacional', 'mecenas_cambio', 'admin', 'guest'
]);

export const UserStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const ProjectStatusSchema = z.enum(['active', 'inactive', 'closed', 'suspended']);

export const TrajectoryStatusSchema = z.enum(['on_track', 'at_risk', 'stalled', 'completed']);

export const EvaluationTypeSchema = z.enum(['automatic', 'human', 'hybrid']);

export const EvaluationResultSchema = z.enum(['approved', 'rejected', 'needs_revision']);

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}).strict();

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(15),
  confirmPassword: z.string(),
  fullName: z.string().min(1),
}).strict();

export const AuthResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
}).strict();

export const RegisterResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
}).strict();

export const ErrorResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  error: z.string().optional(),
}).strict();

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  provider: z.enum(['local', 'google']),
  avatar: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  projectName: z.string(),
  projectImageUrl: z.string().nullable().optional(),
  status: ProjectStatusSchema,
  country: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  startupLinkedinUrl: z.string().url().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  rlabProfileUrl: z.string().url().nullable().optional(),
  trajectoryStatus: TrajectoryStatusSchema.optional(),
  currentTramoId: z.string().uuid().nullable().optional(),
  currentPacId: z.string().uuid().nullable().optional(),
  nftImageUrl: z.string().nullable().optional(),
  lastActivityAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict();

export const CreateProjectRequestSchema = z.object({
  projectName: z.string().min(1),
  status: ProjectStatusSchema.optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  tagline: z.string().optional(),
  shortDescription: z.string().optional(),
  startupLinkedinUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  rlabProfileUrl: z.string().url().optional(),
  trajectoryStatus: TrajectoryStatusSchema.optional(),
}).strict();

export const UpdateProjectRequestSchema = z.object({
  projectName: z.string().min(1).optional(),
  status: ProjectStatusSchema.optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  tagline: z.string().optional(),
  shortDescription: z.string().optional(),
  startupLinkedinUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  rlabProfileUrl: z.string().url().optional(),
  trajectoryStatus: TrajectoryStatusSchema.optional(),
}).strict();

export const PaginatedProjectsSchema = z.object({
  data: z.array(ProjectSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
}).strict();

export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type TrajectoryStatus = z.infer<typeof TrajectoryStatusSchema>;
export type EvaluationType = z.infer<typeof EvaluationTypeSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;
export type PaginatedProjects = z.infer<typeof PaginatedProjectsSchema>;
