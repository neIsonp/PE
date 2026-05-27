import { z } from "zod";
import { roleSchema } from "../../shared/zod.js";

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
  bio: z.string().nullable(),
  institution: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

const avatarUrlSchema = z
  .string()
  .trim()
  .max(200_000, "A imagem do perfil é demasiado grande.")
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("https://") ||
      value.startsWith("http://") ||
      /^data:image\/(png|jpeg|jpg|webp);base64,/.test(value),
    "Indique uma imagem válida."
  );

export const updateProfileBodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  bio: z.string().trim().max(500).nullable().optional(),
  institution: z.string().trim().max(160).nullable().optional(),
  avatarUrl: avatarUrlSchema.nullable().optional()
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
export type UpdateProfileInput = z.infer<typeof updateProfileBodySchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleBodySchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
