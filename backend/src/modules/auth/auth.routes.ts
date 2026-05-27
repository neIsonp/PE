import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "../../config/env.js";
import { errorResponseSchema } from "../../shared/zod.js";
import { AuditService } from "../audit/audit.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { authResponseSchema, loginBodySchema, registerBodySchema } from "./auth.schemas.js";

export async function authRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  const authService = new AuthService(app.prisma);
  const auditService = new AuditService(app.prisma);
  const authController = new AuthController(authService, auditService, (payload) => app.jwt.sign(payload));

  routes.post(
    "/register",
    {
      config: {
        rateLimit: {
          max: env.AUTH_REGISTER_RATE_LIMIT_MAX,
          timeWindow: env.RATE_LIMIT_WINDOW
        }
      },
      schema: {
        tags: ["auth"],
        body: registerBodySchema,
        response: {
          201: authResponseSchema,
          409: errorResponseSchema
        }
      }
    },
    (request, reply) => authController.register(request, reply)
  );

  routes.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: env.AUTH_LOGIN_RATE_LIMIT_MAX,
          timeWindow: env.RATE_LIMIT_WINDOW
        }
      },
      schema: {
        tags: ["auth"],
        body: loginBodySchema,
        response: {
          200: authResponseSchema,
          401: errorResponseSchema
        }
      }
    },
    (request) => authController.login(request)
  );
}
