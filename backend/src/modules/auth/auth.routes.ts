import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { errorResponseSchema } from "../../shared/zod.js";
import { AuthService } from "./auth.service.js";
import { authResponseSchema, loginBodySchema, registerBodySchema } from "./auth.schemas.js";

export async function authRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.post(
    "/register",
    {
      schema: {
        tags: ["auth"],
        body: registerBodySchema,
        response: {
          201: authResponseSchema,
          409: errorResponseSchema
        }
      }
    },
    async (request, reply) => {
      const service = new AuthService(app.prisma);
      const user = await service.register(request.body);
      const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });

      return reply.code(201).send({ user, token });
    }
  );

  routes.post(
    "/login",
    {
      schema: {
        tags: ["auth"],
        body: loginBodySchema,
        response: {
          200: authResponseSchema,
          401: errorResponseSchema
        }
      }
    },
    async (request) => {
      const service = new AuthService(app.prisma);
      const user = await service.validateLogin(request.body);
      const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });

      return { user, token };
    }
  );
}
