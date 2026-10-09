// AUTO-GENERADO por scripts/generate-zod.ts — NO EDITAR A MANO.
// Fuente: src/openapi.json (generado por NestJS).
// Para regenerar: npm run contract:generate desde la raiz del backend.

import { z } from 'zod';

export const UserRoleSchema = z.enum(['entrepreneur', 'mentor', 'evaluator', 'mecenas_semilla', 'mecenas_fundacional', 'mecenas_cambio', 'admin', 'guest']);
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
  provider: AuthProviderSchema,
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

export const AuthResponseSchema = z.strictObject({
  message: z.string(),
  user: UserSchema,
});

export const RegisterRequestSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(8).max(15),
  confirmPassword: z.string(),
  fullName: z.string(),
  role: UserRoleSchema,
});

export const RegisterResponseSchema = z.strictObject({
  message: z.string(),
  user: UserSchema,
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
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;
export type CompleteProfileResponse = z.infer<typeof CompleteProfileResponseSchema>;
export type GoogleExchangeRequest = z.infer<typeof GoogleExchangeRequestSchema>;
export type GoogleExchangeResponse = z.infer<typeof GoogleExchangeResponseSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
