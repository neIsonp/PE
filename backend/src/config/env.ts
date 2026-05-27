import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:3000"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(16).default(12)
});

export const env = envSchema.parse(process.env);
export type AppEnv = z.infer<typeof envSchema>;
