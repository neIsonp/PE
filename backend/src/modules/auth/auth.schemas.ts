import { z } from "zod";
import { passwordSchema } from "../../shared/zod.js";
import { publicUserSchema } from "../users/user.schemas.js";

export const registerBodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: passwordSchema,
  institution: z.string().trim().max(160).optional()
});

export const loginBodySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1)
});

export const authResponseSchema = z.object({
  token: z.string(),
  user: publicUserSchema
});

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
