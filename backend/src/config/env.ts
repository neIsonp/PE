import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  FRONTEND_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(16).default(12),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW: z.string().min(1).default("1 minute"),
  AUTH_REGISTER_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(8),
  AUTH_LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(12),
  PUBLIC_FORM_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10)
});

export const env = envSchema.parse(process.env);
export type AppEnv = z.infer<typeof envSchema>;
