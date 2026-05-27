import { z } from "zod";
import { roleSchema } from "../../shared/zod.js";

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
  bio: z.string().nullable(),
  institution: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const updateProfileBodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(500).nullable().optional(),
  institution: z.string().trim().max(160).nullable().optional()
});

export const updateRoleBodySchema = z.object({
  role: roleSchema
});

export const userIdParamsSchema = z.object({
  id: z.string().min(1)
});

export const usersListResponseSchema = z.object({
  users: z.array(publicUserSchema)
});

export const userResponseSchema = z.object({
  user: publicUserSchema
});

export type PublicUser = z.infer<typeof publicUserSchema>;
