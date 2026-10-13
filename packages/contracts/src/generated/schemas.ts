// AUTO-GENERADO por scripts/generate-zod.ts — NO EDITAR A MANO.
// Fuente: src/openapi.json (generado por NestJS).
// Para regenerar: npm run contract:generate desde la raiz del backend.

import { z } from 'zod';

export const UserRoleSchema = z.enum(['entrepreneur', 'mentor', 'evaluator', 'mecenas_semilla', 'mecenas_fundacional', 'mecenas_cambio', 'admin', 'guest', 'demo_readonly']);
export const UserStatusSchema = z.enum(['active', 'inactive', 'suspended', 'pending_profile']);
export const AuthProviderSchema = z.enum(['local', 'google']);
export const ProjectStatusSchema = z.enum(['active', 'inactive', 'closed', 'suspended']);
export const TrajectoryStatusSchema = z.enum(['on_track', 'at_risk', 'stalled', 'completed']);

export const LoginRequestSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(1),
});

export const UserSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string(),
  role: UserRoleSchema.nullable(),
  status: UserStatusSchema,
  provider: z.enum(["local", "google", "wallet"]),
  linkedinId: z.string().nullable().optional(),
  googleId: z.string().nullable().optional(),
  cryptoWallet: z.string().nullable().optional(),
  credentialsWallet: z.string().nullable().optional(),
  adnHash: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  gender: z.enum(["male", "female", "non_binary", "other", "prefer_not_to_say"]).nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const UserProfileSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string(),
  role: UserRoleSchema.nullable(),
  status: UserStatusSchema,
  provider: z.enum(["local", "google", "wallet"]),
  linkedinId: z.string().nullable().optional(),
  googleId: z.string().nullable().optional(),
  cryptoWallet: z.string().nullable().optional(),
  credentialsWallet: z.string().nullable().optional(),
  adnHash: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  gender: z.enum(["male", "female", "non_binary", "other", "prefer_not_to_say"]).nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  permissions: z.array(z.string()),
});

export const AuthResponseSchema = z.strictObject({
  message: z.string(),
  user: UserSchema,
});

export const RegisterRequestSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(8).max(15),
  confirmPassword: z.string(),
  fullName: z.string(),
  role: z.enum(["entrepreneur", "evaluator"]).nullable().optional(),
});

export const RegisterResponseSchema = z.strictObject({
  message: z.string(),
  user: UserSchema,
});

export const ProjectProfileSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  longDescription: z.string().nullable().optional(),
  problemStatement: z.string().nullable().optional(),
  solutionStatement: z.string().nullable().optional(),
  targetAudience: z.string().nullable().optional(),
  sdgGoals: z.array(z.string()).nullable().optional(),
  valueProposition: z.string().nullable().optional(),
  businessModelSummary: z.string().nullable().optional(),
  stageNotes: z.string().nullable().optional(),
  pitchUrl: z.string().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ProjectMemberSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  gender: z.enum(["male", "female", "non_binary", "other", "prefer_not_to_say"]).nullable().optional(),
  userId: z.uuid(),
  roleInTeam: z.enum(["founder", "co_founder", "cto", "cmo", "developer", "designer", "advisor", "other"]),
  joinedAt: z.iso.datetime().nullable().optional(),
  leftAt: z.iso.datetime().nullable().optional(),
  isActive: z.boolean(),
  participationWeight: z.string().nullable().optional(),
  isFounder: z.boolean(),
  isPrimaryOperator: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const PacSchema = z.strictObject({
  id: z.uuid(),
  categoryId: z.uuid(),
  code: z.string(),
  title_es: z.string(),
  title_en: z.string(),
  objectiveLine_es: z.string().nullable().optional(),
  objectiveLine_en: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number(),
  executionWindowDays: z.number().nullable().optional(),
  minimumCompletionThreshold: z.string().nullable().optional(),
  icWeight: z.string().nullable().optional(),
  closureRule: z.string().nullable().optional(),
  templateVersion: z.string().nullable().optional(),
  isActive: z.boolean(),
  validFrom: z.iso.datetime().nullable().optional(),
  validTo: z.iso.datetime().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ProjectPacSchema = z.strictObject({
  id: z.uuid(),
  projectId: z.uuid(),
  pacId: z.uuid(),
  status: z.enum(["pending", "in_progress", "completed"]),
  progress: z.string().nullable().optional(),
  startedAt: z.iso.datetime().nullable().optional(),
  completedAt: z.iso.datetime().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  pac: PacSchema.optional(),
});

export const ProjectSchema = z.strictObject({
  id: z.uuid(),
  ownerUserId: z.uuid(),
  projectName: z.string().min(1),
  projectImageUrl: z.string().nullable().optional(),
  status: ProjectStatusSchema,
  country: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  shortDescription: z.string().nullable().optional(),
  startupLinkedinUrl: z.url().nullable().optional(),
  websiteUrl: z.url().nullable().optional(),
  rlabProfileUrl: z.url().nullable().optional(),
  openedAt: z.iso.datetime().nullable().optional(),
  closedAt: z.iso.datetime().nullable().optional(),
  closeReason: z.string().nullable().optional(),
  currentTramoId: z.uuid().nullable().optional(),
  currentPacId: z.uuid().nullable().optional(),
  trajectoryStatus: TrajectoryStatusSchema.nullable().optional(),
  nftImageUrl: z.string().nullable().optional(),
  lastActivityAt: z.iso.datetime().nullable().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  owner: UserSchema.optional(),
  profile: ProjectProfileSchema.nullable().optional(),
  members: z.array(ProjectMemberSchema).optional(),
  projectPacs: z.array(ProjectPacSchema).optional(),
});

export const CreateProjectRequestSchema = z.strictObject({
  projectName: z.string().min(1),
  image: z.any().optional(),
  status: ProjectStatusSchema.optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  tagline: z.string().optional(),
  shortDescription: z.string().optional(),
  startupLinkedinUrl: z.url().optional(),
  websiteUrl: z.url().optional(),
  rlabProfileUrl: z.url().optional(),
  trajectoryStatus: TrajectoryStatusSchema.optional(),
});

export const UpdateProjectRequestSchema = z.strictObject({
  projectName: z.string().min(1).optional(),
  image: z.any().optional(),
  status: ProjectStatusSchema.optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  tagline: z.string().optional(),
  shortDescription: z.string().optional(),
  startupLinkedinUrl: z.url().optional(),
  websiteUrl: z.url().optional(),
  rlabProfileUrl: z.url().optional(),
  trajectoryStatus: TrajectoryStatusSchema.optional(),
});

export const CompleteProfileResponseSchema = z.strictObject({
  message: z.string(),
  user: UserSchema,
});

export const GoogleExchangeRequestSchema = z.strictObject({
  code: z.string(),
});

export const GoogleExchangeResponseSchema = z.strictObject({
  message: z.string(),
  user: UserSchema,
  requiresProfileCompletion: z.boolean(),
  profileCompletionToken: z.string().optional(),
});

export const MessageResponseSchema = z.strictObject({
  message: z.string(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
export type AuthProvider = z.infer<typeof AuthProviderSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type TrajectoryStatus = z.infer<typeof TrajectoryStatusSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectProfile = z.infer<typeof ProjectProfileSchema>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type Pac = z.infer<typeof PacSchema>;
export type ProjectPac = z.infer<typeof ProjectPacSchema>;
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;
export type CompleteProfileResponse = z.infer<typeof CompleteProfileResponseSchema>;
export type GoogleExchangeRequest = z.infer<typeof GoogleExchangeRequestSchema>;
export type GoogleExchangeResponse = z.infer<typeof GoogleExchangeResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
