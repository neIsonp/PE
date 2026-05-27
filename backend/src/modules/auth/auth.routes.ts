import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { errorResponseSchema } from "../../shared/zod.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { authResponseSchema, loginBodySchema, registerBodySchema } from "./auth.schemas.js";

export async function authRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  const authService = new AuthService(app.prisma);
  const authController = new AuthController(authService, (payload) => app.jwt.sign(payload));

  routes.post(
    "/register",
    {
      config: {
        rateLimit: {
          max: 8,
          timeWindow: "1 minute"
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
          max: 12,
          timeWindow: "1 minute"
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
