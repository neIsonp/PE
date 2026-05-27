import { z } from "zod";
import { userRoles } from "./roles.js";

export const roleSchema = z.enum(userRoles);

export const passwordSchema = z
  .string()
  .min(8, "A palavra-passe deve ter pelo menos 8 caracteres.")
  .regex(/[A-Z]/, "A palavra-passe deve incluir uma maiúscula.")
  .regex(/[a-z]/, "A palavra-passe deve incluir uma minúscula.")
  .regex(/[0-9]/, "A palavra-passe deve incluir um número.");

export const errorResponseSchema = z.object({
  message: z.string(),
  details: z.unknown().optional()
});

export const messageResponseSchema = z.object({
  message: z.string()
});
