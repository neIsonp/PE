import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { AppError } from "../../shared/app-error.js";
import { errorResponseSchema } from "../../shared/zod.js";
import { UserService } from "./user.service.js";
import {
  updateProfileBodySchema,
  updateRoleBodySchema,
  userIdParamsSchema,
  userResponseSchema,
  usersListResponseSchema
} from "./user.schemas.js";

export async function userRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();

  routes.get(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: userResponseSchema,
          401: errorResponseSchema
        }
      }
    },
    async (request) => {
      const service = new UserService(app.prisma);
      const user = await service.getUserById(request.user.sub);

      return { user };
    }
  );

  routes.put(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        body: updateProfileBodySchema,
        response: {
          200: userResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    async (request) => {
      const service = new UserService(app.prisma);
      const user = await service.updateProfile(request.user.sub, request.body);

      return { user };
    }
  );

  routes.get(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: usersListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema
        }
      }
    },
    async (request) => {
      if (request.user.role !== "ADMIN") {
        throw new AppError(403, "Apenas administradores podem listar utilizadores.");
      }

      const service = new UserService(app.prisma);
      const users = await service.listUsers();

      return { users };
    }
  );

  routes.patch(
    "/:id/role",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        params: userIdParamsSchema,
        body: updateRoleBodySchema,
        response: {
          200: userResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    async (request) => {
      if (request.user.role !== "ADMIN") {
        throw new AppError(403, "Apenas administradores podem alterar permissões.");
      }

      const service = new UserService(app.prisma);
      const user = await service.updateRole(request.params.id, request.body.role);

      return { user };
    }
  );
}
